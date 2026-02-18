# backend/app/routers/reports.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.models import (
    User, Progress, EikenResult, 
    PastExamResult, MockExamResult, UniversityAcceptance
)
from app.utils.pdf_generator import create_pdf_from_template

router = APIRouter()

# --- Pydantic Schema ---
class ReportRequest(BaseModel):
    chart_image: Optional[str] = None
class IntegratedReportRequest(BaseModel):
    sections: List[str]  # ["dashboard", "calendar", "mock_exams", "past_exams"]
    chart_images: Dict[str, Optional[str]] = {} # {"dashboard": "base64...", "past_exams": "base64..."}

# --- Endpoints ---

# 1. 学習ダッシュボード レポート
@router.post("/dashboard/{student_id}")
def generate_dashboard_report(
    student_id: int, 
    request: ReportRequest, 
    session: Session = Depends(get_db)
):
    student = session.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
    
    total_study_time = 0.0
    total_progress_pct = 0.0
    formatted_items = []
    
    if progress_items:
        valid_items = [p for p in progress_items if p.total_units > 0]
        if valid_items:
            ratios = [min(1.0, p.completed_units / p.total_units) for p in valid_items]
            total_progress_pct = (sum(ratios) / len(ratios)) * 100
        
        for item in progress_items:
            pct = 0
            if item.total_units > 0:
                pct = round((item.completed_units / item.total_units) * 100)
                if item.duration and item.duration > 0:
                     ratio = min(1.0, item.completed_units / item.total_units)
                     total_study_time += ratio * item.duration
            
            formatted_items.append({
                "subject": item.subject or "-",
                "book_name": item.book_name,
                "completed_units": item.completed_units,
                "total_units": item.total_units,
                "pct": pct
            })

    latest_eiken = session.query(EikenResult).filter(EikenResult.student_id == student_id).order_by(desc(EikenResult.exam_date)).first()
    eiken_str = "未登録"
    if latest_eiken:
        eiken_str = latest_eiken.grade
        if latest_eiken.cse_score:
            eiken_str += f" / CSE {latest_eiken.cse_score}"

    context = {
        "student_name": student.username,
        "date_str": datetime.now().strftime("%Y年%m月%d日"),
        "total_study_time": round(total_study_time, 1),
        "total_progress_pct": round(total_progress_pct, 1),
        "eiken_str": eiken_str,
        "items": formatted_items,
        "chart_image": request.chart_image
    }

    pdf_buffer = create_pdf_from_template("report_template.html", context)
    filename = f"dashboard_{student_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

# 2. 過去問演習 レポート
@router.post("/past-exams/{student_id}")
def generate_past_exam_report(
    student_id: int,
    request: ReportRequest,
    session: Session = Depends(get_db)
):
    student = session.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    results = session.query(PastExamResult).filter(PastExamResult.student_id == student_id).all()
    
    formatted_items = []
    for r in results:
        formatted_items.append({
            "date": r.date,
            "university": r.university_name,
            "faculty": r.faculty_name,
            "year": r.year,
            "subject": r.subject,
            "correct_answers": r.correct_answers or 0,
            "total_questions": r.total_questions or 0
        })

    context = {
        "student_name": student.username,
        "date_str": datetime.now().strftime("%Y年%m月%d日"),
        "items": formatted_items,
        "chart_image": request.chart_image
    }

    pdf_buffer = create_pdf_from_template("past_exam_report.html", context)
    filename = f"past_exam_{student_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

# 3. 模試成績 レポート
@router.post("/mock-exams/{student_id}")
def generate_mock_exam_report(
    student_id: int,
    request: ReportRequest,
    session: Session = Depends(get_db)
):
    student = session.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    results = session.query(MockExamResult).filter(MockExamResult.student_id == student_id).all()

    formatted_items = []
    for r in results:
        score_summary = f"{r.mock_exam_format}" # 簡易表示
        formatted_items.append({
            "name": r.mock_exam_name,
            "type": r.result_type,
            "grade": r.grade,
            "score_summary": score_summary
        })

    context = {
        "student_name": student.username,
        "date_str": datetime.now().strftime("%Y年%m月%d日"),
        "items": formatted_items,
        "chart_image": request.chart_image
    }

    pdf_buffer = create_pdf_from_template("mock_exam_report.html", context)
    filename = f"mock_exam_{student_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

# 4. 入試カレンダー レポート
@router.post("/calendar/{student_id}")
def generate_calendar_report(
    student_id: int,
    request: ReportRequest,
    session: Session = Depends(get_db)
):
    student = session.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    acceptances = session.query(UniversityAcceptance).filter(UniversityAcceptance.student_id == student_id).all()

    formatted_items = []
    for a in acceptances:
        formatted_items.append({
            "univ": a.university_name,
            "faculty": a.faculty_name,
            "exam_date": a.exam_date or "-",
            "announce_date": a.announcement_date or "-"
        })

    context = {
        "student_name": student.username,
        "date_str": datetime.now().strftime("%Y年%m月%d日"),
        "items": formatted_items,
        "chart_image": request.chart_image
    }

    pdf_buffer = create_pdf_from_template("calendar_report.html", context)
    filename = f"calendar_{student_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

@router.post("/integrated/{student_id}")
def generate_integrated_report(
    student_id: int, 
    request: IntegratedReportRequest, 
    session: Session = Depends(get_db)
):
    student = session.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # コンテキストの初期化
    context = {
        "student_name": student.username,
        "date_str": datetime.now().strftime("%Y年%m月%d日"),
        "sections": request.sections,
        "images": request.chart_images,
        "dashboard": None,
        "past_exams": [],
        "mock_exams": [],
        "calendar": [],
        "eiken_str": "未登録"
    }

    # 1. ダッシュボードデータ取得
    if "dashboard" in request.sections:
        progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
        
        formatted_items = []
        total_study_time = 0.0
        total_progress_pct = 0.0
        
        if progress_items:
            valid_items = [p for p in progress_items if p.total_units > 0]
            if valid_items:
                ratios = [min(1.0, p.completed_units / p.total_units) for p in valid_items]
                total_progress_pct = (sum(ratios) / len(ratios)) * 100
            
            for item in progress_items:
                pct = 0
                if item.total_units > 0:
                    pct = round((item.completed_units / item.total_units) * 100)
                    if item.duration and item.duration > 0:
                         ratio = min(1.0, item.completed_units / item.total_units)
                         total_study_time += ratio * item.duration
                
                formatted_items.append({
                    "subject": item.subject or "-",
                    "book_name": item.book_name,
                    "pct": pct
                })

        # 英検情報
        latest_eiken = session.query(EikenResult).filter(EikenResult.student_id == student_id).order_by(desc(EikenResult.exam_date)).first()
        if latest_eiken:
            eiken_str = latest_eiken.grade
            if latest_eiken.cse_score:
                eiken_str += f" / CSE {latest_eiken.cse_score}"
            context["eiken_str"] = eiken_str

        context["dashboard"] = {
            "total_study_time": round(total_study_time, 1),
            "total_progress_pct": round(total_progress_pct, 1),
            "items": formatted_items
        }

    # 2. 過去問データ取得
    if "past_exams" in request.sections:
        results = session.query(PastExamResult).filter(PastExamResult.student_id == student_id).all()
        formatted_past = []
        for r in results:
            formatted_past.append({
                "date": r.date,
                "university": r.university_name,
                "faculty": r.faculty_name,
                "year": r.year,
                "subject": r.subject,
                "correct_answers": r.correct_answers or 0,
                "total_questions": r.total_questions or 0
            })
        context["past_exams"] = formatted_past

    # 3. 模試データ取得
    if "mock_exams" in request.sections:
        results = session.query(MockExamResult).filter(MockExamResult.student_id == student_id).all()
        formatted_mock = []
        for r in results:
            formatted_mock.append({
                "name": r.mock_exam_name,
                "type": r.result_type,
                "grade": r.grade,
                "score_summary": f"{r.mock_exam_format}" # 簡易表示
            })
        context["mock_exams"] = formatted_mock

    # 4. カレンダーデータ取得
    if "calendar" in request.sections:
        acceptances = session.query(UniversityAcceptance).filter(UniversityAcceptance.student_id == student_id).all()
        formatted_cal = []
        for a in acceptances:
            formatted_cal.append({
                "univ": a.university_name,
                "faculty": a.faculty_name,
                "exam_date": a.exam_date or "-",
                "announce_date": a.announcement_date or "-"
            })
        context["calendar"] = formatted_cal

    # PDF生成
    pdf_buffer = create_pdf_from_template("integrated_report_template.html", context)
    filename = f"report_{student_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )