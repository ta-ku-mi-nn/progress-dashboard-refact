# backend/app/routers/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.database import get_db
from app.models.models import Progress, EikenResult, MasterTextbook, BulkPreset, BulkPresetBook, User
from app.utils.pdf_generator import create_pdf_from_template

router = APIRouter()

# --- Pydantic Schemas ---
class ProgressUpdate(BaseModel):
    completed_units: int
    total_units: int

class CustomBookSchema(BaseModel):
    subject: str
    level: str
    book_name: str
    duration: float = 0.0

class ProgressCreate(BaseModel):
    student_id: int
    book_ids: List[int] = [] 
    custom_books: List[CustomBookSchema] = []

# フロントエンドのDashboard.tsxが期待するデータ型
class DashboardData(BaseModel):
    student_id: int
    total_study_time: float
    total_planned_time: float = 0.0 # 追加
    progress_rate: float = 0.0
    eiken_grade: Optional[str] = None # 追加
    eiken_score: Optional[str] = None # 追加 (連結ではなくスコア単体を入れる想定)
    eiken_date: Optional[str] = None  # 追加

class ReportRequest(BaseModel):
    chart_image: Optional[str] = None

# --- Endpoints ---

@router.get("/{student_id}", response_model=DashboardData)
def get_dashboard_data(student_id: int, session: Session = Depends(get_db)):
    # 1. 生徒存在確認
    student = session.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. 進捗アイテム取得
    progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
    
    total_progress_pct = 0.0
    total_completed_time = 0.0
    total_planned_time = 0.0
    
    if progress_items:
        # 進捗率平均
        valid_items_for_pct = [p for p in progress_items if p.total_units > 0]
        if valid_items_for_pct:
            ratios = [min(1.0, p.completed_units / p.total_units) for p in valid_items_for_pct]
            total_progress_pct = (sum(ratios) / len(ratios)) * 100
        
        # 学習時間計算
        for item in progress_items:
            if item.duration and item.duration > 0:
                total_planned_time += item.duration
                if item.total_units > 0:
                    ratio = min(1.0, item.completed_units / item.total_units)
                    total_completed_time += ratio * item.duration

    # 3. 英検結果取得とフォーマット整形
    latest_eiken = (
        session.query(EikenResult)
        .filter(EikenResult.student_id == student_id)
        .order_by(desc(EikenResult.exam_date))
        .first()
    )
    
    eiken_grade = None
    eiken_score = None
    eiken_date = None

    if latest_eiken:
        # ★修正ポイント: 合否(result)を結合せず、単純に級(grade)だけを返す
        eiken_grade = latest_eiken.grade 
        
        # スコア (CSE XXXX の数値部分だけを想定、もしくは文字列そのまま)
        eiken_score = str(latest_eiken.cse_score) if latest_eiken.cse_score is not None else None
        
        # ★修正ポイント: 日付を文字列としてそのまま返す (DB定義変更前提)
        eiken_date = latest_eiken.exam_date

    return {
        "student_id": student.id,
        "total_study_time": round(total_completed_time, 1),
        "total_planned_time": round(total_planned_time, 1),
        "progress_rate": round(total_progress_pct, 1),
        "eiken_grade": eiken_grade,
        "eiken_score": eiken_score,
        "eiken_date": eiken_date
    }


# 既存: 詳細なサマリー用 (グラフ表示などで使用)
@router.get("/summary/{student_id}")
def get_dashboard_summary(
    student_id: int, 
    session: Session = Depends(get_db)
) -> Dict[str, Any]:
    progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
    
    total_progress_pct = 0.0
    total_planned_time = 0.0
    total_completed_time = 0.0
    
    if progress_items:
        valid_items_for_pct = [p for p in progress_items if p.total_units > 0]
        if valid_items_for_pct:
            ratios = [p.completed_units / p.total_units for p in valid_items_for_pct]
            total_progress_pct = (sum(ratios) / len(ratios)) * 100
        
        for item in progress_items:
            if item.duration and item.duration > 0 and item.total_units > 0:
                total_planned_time += item.duration
                ratio = min(1.0, item.completed_units / item.total_units)
                total_completed_time += ratio * item.duration

    latest_eiken = (
        session.query(EikenResult)
        .filter(EikenResult.student_id == student_id)
        .order_by(desc(EikenResult.exam_date))
        .first()
    )

    eiken_data = None
    if latest_eiken:
        eiken_data = {
            "grade": latest_eiken.grade,
            "score": latest_eiken.cse_score,
            "result": latest_eiken.result,
            "exam_date": latest_eiken.exam_date
        }

    return {
        "total_progress": round(total_progress_pct, 1),
        "total_planned_time": round(total_planned_time, 1),
        "total_completed_time": round(total_completed_time, 1),
        "latest_eiken": eiken_data
    }

# ★追加: グラフ用エンドポイント (以前のやり取りで追加したもの)
@router.get("/chart/{student_id}")
def get_subject_chart(student_id: int, session: Session = Depends(get_db)):
    items = session.query(Progress).filter(Progress.student_id == student_id).all()
    subject_map = {}
    
    for item in items:
        if item.total_units > 0:
            ratio = min(1.0, item.completed_units / item.total_units)
            if item.subject not in subject_map:
                subject_map[item.subject] = []
            subject_map[item.subject].append(ratio * 100)
            
    result = []
    for subj, ratios in subject_map.items():
        avg_progress = sum(ratios) / len(ratios)
        result.append({
            "subject": subj,
            "progress": round(avg_progress, 1)
        })
    if not result:
        return []
    return result

@router.get("/list/{student_id}")
def get_progress_list(student_id: int, session: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    items = session.query(Progress).filter(Progress.student_id == student_id).all()
    return [
        {
            "id": item.id,
            "subject": item.subject,
            "book_name": item.book_name,
            "completed_units": item.completed_units,
            "total_units": item.total_units
        }
        for item in items
    ]

@router.patch("/progress/{row_id}")
def update_progress(
    row_id: int, 
    update_data: ProgressUpdate, 
    session: Session = Depends(get_db)
):
    progress_item = session.query(Progress).filter(Progress.id == row_id).first()
    if not progress_item:
        raise HTTPException(status_code=404, detail="Progress item not found")
    
    progress_item.completed_units = update_data.completed_units
    progress_item.total_units = update_data.total_units 
    
    session.add(progress_item)
    session.commit()
    session.refresh(progress_item)
    return progress_item

@router.get("/books/master")
def get_master_books(session: Session = Depends(get_db)):
    return session.query(MasterTextbook).all()

@router.post("/progress/batch")
def add_progress_batch(
    data: ProgressCreate,
    session: Session = Depends(get_db)
):
    added_items = []

    for book_id in data.book_ids:
        master_book = session.query(MasterTextbook).filter(MasterTextbook.id == book_id).first()
        if not master_book:
            continue
            
        exists = session.query(Progress).filter(
            Progress.student_id == data.student_id,
            Progress.book_name == master_book.book_name,
            Progress.subject == master_book.subject
        ).first()

        if exists:
            continue

        new_progress = Progress(
            student_id=data.student_id,
            subject=master_book.subject,
            level=master_book.level,
            book_name=master_book.book_name,
            duration=master_book.duration,
            is_planned=True,
            is_done=False,
            completed_units=0,
            total_units=1 
        )
        session.add(new_progress)
        added_items.append(new_progress)

    for custom in data.custom_books:
        exists = session.query(Progress).filter(
            Progress.student_id == data.student_id,
            Progress.book_name == custom.book_name,
            Progress.subject == custom.subject
        ).first()

        if exists:
            continue

        new_progress = Progress(
            student_id=data.student_id,
            subject=custom.subject,
            level=custom.level,
            book_name=custom.book_name,
            duration=custom.duration,
            is_planned=True,
            is_done=False,
            completed_units=0,
            total_units=1 
        )
        session.add(new_progress)
        added_items.append(new_progress)
    
    session.commit()
    return {"message": f"{len(added_items)} items added"}

@router.get("/presets")
def get_presets(session: Session = Depends(get_db)):
    presets = session.query(BulkPreset).options(joinedload(BulkPreset.books)).all()
    all_masters = session.query(MasterTextbook).all()
    master_map = { (m.subject, m.book_name): m for m in all_masters }

    result = []
    for p in presets:
        books_data = []
        for pb in p.books:
            key = (p.subject, pb.book_name)
            master_info = master_map.get(key)

            if master_info:
                books_data.append({
                    "id": master_info.id,
                    "subject": master_info.subject,
                    "level": master_info.level,
                    "book_name": master_info.book_name,
                    "duration": master_info.duration,
                    "is_master": True
                })
            else:
                books_data.append({
                    "id": None, 
                    "subject": p.subject,
                    "level": "プリセット", 
                    "book_name": pb.book_name,
                    "duration": 0, 
                    "is_master": False
                })
        
        result.append({
            "id": p.id,
            "name": p.preset_name,
            "subject": p.subject,
            "books": books_data
        })
        
    return result

@router.delete("/progress/{row_id}")
def delete_progress(row_id: int, session: Session = Depends(get_db)):
    progress_item = session.query(Progress).filter(Progress.id == row_id).first()
    if not progress_item:
        raise HTTPException(status_code=404, detail="Progress item not found")
    
    session.delete(progress_item)
    session.commit()
    return {"message": "Deleted successfully"}

@router.get("/report/{student_id}")
def generate_dashboard_report(student_id: int, request: ReportRequest, session: Session = Depends(get_db)):
    # 1. データ取得 (ロジックは既存と同じ)
    student = session.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
    latest_eiken = (
        session.query(EikenResult)
        .filter(EikenResult.student_id == student_id)
        .order_by(desc(EikenResult.exam_date))
        .first()
    )

    # 2. データ整形
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

    eiken_str = "未登録"
    if latest_eiken:
        eiken_str = latest_eiken.grade
        if latest_eiken.cse_score:
            eiken_str += f" / CSE {latest_eiken.cse_score}"

    # 3. テンプレート用コンテキスト作成
    context = {
        "student_name": student.username,
        "date_str": datetime.now().strftime("%Y年%m月%d日"),
        "total_study_time": round(total_study_time, 1),
        "total_progress_pct": round(total_progress_pct, 1),
        "eiken_str": eiken_str,
        "items": formatted_items,
        "chart_image": request.chart_image
    }

    # 4. PDF生成
    try:
        pdf_buffer = create_pdf_from_template("report_template.html", context)
        
        filename = f"report_{student_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={filename}"}
        )
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")
