# backend/app/routers/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

from app.db.database import get_db
from app.models.models import Progress, EikenResult, MasterTextbook, BulkPreset, BulkPresetBook, User, Student

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def get_adjusted_duration(base_duration: float, book_level: str, student_dev: Optional[float]) -> float:
    if not base_duration or not student_dev or not book_level:
        return float(base_duration or 0.0)

    level_map = {
        "基礎徹底": 50,
        "日大": 60,
        "MARCH": 70,
        "早慶": 75
    }

    target_dev = None
    for key, val in level_map.items():
        if key in book_level:
            target_dev = val
            break
            
    if target_dev is None:
        return float(base_duration)

    diff = target_dev - student_dev
    adjusted_time = base_duration + base_duration * diff * 0.025
    adjusted_time = max(0.1, adjusted_time)
    return round(adjusted_time, 1)

class DashboardData(BaseModel):
    student_id: int
    total_study_time: float      
    total_planned_time: float    
    progress_rate: float         
    eiken_grade: Optional[str] = "未登録"
    eiken_score: Optional[str] = "-"
    eiken_date: Optional[str] = "-"

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

# ==========================================
# ★修正: 固定パスのエンドポイントを上に移動！
# ==========================================

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
                books_data.append({"id": master_info.id, "subject": master_info.subject, "level": master_info.level, "book_name": master_info.book_name, "duration": master_info.duration, "is_master": True})
            else:
                books_data.append({"id": None, "subject": p.subject, "level": "プリセット", "book_name": pb.book_name, "duration": 0, "is_master": False})
        result.append({"id": p.id, "name": p.preset_name, "subject": p.subject, "books": books_data})
    return result

@router.get("/books/master")
def get_master_books(session: Session = Depends(get_db)):
    return session.query(MasterTextbook).all()

@router.post("/progress/batch")
def add_progress_batch(data: ProgressCreate, session: Session = Depends(get_db)):
    added_items = []
    for book_id in data.book_ids:
        master_book = session.query(MasterTextbook).filter(MasterTextbook.id == book_id).first()
        if not master_book: continue
        exists = session.query(Progress).filter(Progress.student_id == data.student_id, Progress.book_name == master_book.book_name).first()
        if exists: continue
        new_progress = Progress(
            student_id=data.student_id, subject=master_book.subject, level=master_book.level,
            book_name=master_book.book_name, duration=master_book.duration,
            is_planned=True, is_done=False, completed_units=0, total_units=1 
        )
        session.add(new_progress)
        added_items.append(new_progress)

    for custom in data.custom_books:
        exists = session.query(Progress).filter(Progress.student_id == data.student_id, Progress.book_name == custom.book_name).first()
        if exists: continue
        new_progress = Progress(
            student_id=data.student_id, subject=custom.subject, level=custom.level,
            book_name=custom.book_name, duration=custom.duration,
            is_planned=True, is_done=False, completed_units=0, total_units=1 
        )
        session.add(new_progress)
        added_items.append(new_progress)
    
    session.commit()
    return {"message": f"{len(added_items)} items added"}


# ==========================================
# 変数パス(/{student_id} など)を下に配置
# ==========================================

@router.get("/{student_id}", response_model=DashboardData)
def get_dashboard_data(student_id: int, session: Session = Depends(get_db)):
    student = session.query(Student).filter(Student.id == student_id).first()
    if not student:
        student = session.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student_dev = getattr(student, "deviation_value", None)

    progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
    
    total_completed_time = 0.0
    total_planned_time = 0.0
    weighted_progress_sum = 0.0 
    total_duration_for_rate = 0.0 
    simple_ratios = [] 

    if progress_items:
# その生徒が登録している参考書名だけを抽出
        book_names = list(set([item.book_name for item in progress_items if item.book_name]))
        
        # 必要なマスターデータだけをDBから取得（大幅な高速化）
        masters = session.query(MasterTextbook).filter(MasterTextbook.book_name.in_(book_names)).all()
        master_map = { (m.subject, m.book_name): m for m in masters }

        for item in progress_items:
            duration = item.duration
            book_level = item.level
            
            if (duration is None or duration <= 0) and item.subject and item.book_name:
                master_book = master_map.get((item.subject, item.book_name))
                if master_book:
                    duration = master_book.duration
                    if not book_level:
                        book_level = master_book.level
            
            duration = float(duration or 0)
            
            adjusted_duration = get_adjusted_duration(duration, book_level, student_dev)

            ratio = 0.0
            if (item.total_units or 0) > 0:
                ratio = min(1.0, (item.completed_units or 0) / item.total_units)
            
            simple_ratios.append(ratio)

            if adjusted_duration > 0:
                total_planned_time += adjusted_duration
                total_completed_time += ratio * adjusted_duration
                
                weighted_progress_sum += ratio * adjusted_duration
                total_duration_for_rate += adjusted_duration

    total_progress_pct = 0.0
    if total_duration_for_rate > 0:
        total_progress_pct = (weighted_progress_sum / total_duration_for_rate) * 100
    elif len(simple_ratios) > 0:
        total_progress_pct = (sum(simple_ratios) / len(simple_ratios)) * 100

    latest_eiken = session.query(EikenResult).filter(EikenResult.student_id == student_id).order_by(desc(EikenResult.exam_date)).first()
    eiken_grade = latest_eiken.grade or "未登録" if latest_eiken else "未登録"
    eiken_score = str(latest_eiken.cse_score) if latest_eiken and latest_eiken.cse_score is not None else "-"
    eiken_date = str(latest_eiken.exam_date) if latest_eiken and latest_eiken.exam_date else "-"

    return {
        "student_id": student.id if hasattr(student, 'id') else student_id,
        "total_study_time": round(total_completed_time, 1),
        "total_planned_time": round(total_planned_time, 1),
        "progress_rate": round(total_progress_pct, 1),
        "eiken_grade": eiken_grade,
        "eiken_score": eiken_score,
        "eiken_date": eiken_date
    }


@router.get("/chart/{student_id}")
def get_subject_chart(student_id: int, session: Session = Depends(get_db)):
    student = session.query(Student).filter(Student.id == student_id).first()
    student_dev = getattr(student, "deviation_value", None)

    items = session.query(Progress).filter(Progress.student_id == student_id).all()
    subject_stats = {} 
    
    all_masters = session.query(MasterTextbook).all()
    master_map = { (m.subject, m.book_name): m for m in all_masters }

    for item in items:
        if (item.total_units or 0) <= 0:
            continue

        subj = item.subject or "その他"
        if subj not in subject_stats:
            subject_stats[subj] = {"planned": 0.0, "completed": 0.0, "ratios": []}

        duration = item.duration
        book_level = item.level
        if (duration is None or duration <= 0) and item.subject and item.book_name:
            master_book = master_map.get((item.subject, item.book_name))
            if master_book:
                duration = master_book.duration
                if not book_level:
                    book_level = master_book.level
                    
        duration = float(duration or 0)
        
        adjusted_duration = get_adjusted_duration(duration, book_level, student_dev)

        ratio = min(1.0, (item.completed_units or 0) / item.total_units)
        subject_stats[subj]["ratios"].append(ratio * 100)
        
        if adjusted_duration > 0:
            subject_stats[subj]["planned"] += adjusted_duration
            subject_stats[subj]["completed"] += ratio * adjusted_duration
            
    result = []
    for subj, stats in subject_stats.items():
        if stats["planned"] > 0:
            avg_progress = (stats["completed"] / stats["planned"]) * 100
        elif stats["ratios"]:
            avg_progress = sum(stats["ratios"]) / len(stats["ratios"])
        else:
            avg_progress = 0.0
            
        result.append({
            "subject": subj,
            "progress": round(avg_progress, 1)
        })
        
    return result

@router.get("/list/{student_id}")
def get_progress_list(student_id: int, session: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    items = session.query(Progress).filter(Progress.student_id == student_id).all()
    return [{"id": i.id, "subject": i.subject, "book_name": i.book_name, "completed_units": i.completed_units, "total_units": i.total_units} for i in items]

@router.patch("/progress/{row_id}")
def update_progress(row_id: int, update_data: ProgressUpdate, session: Session = Depends(get_db)):
    progress_item = session.query(Progress).filter(Progress.id == row_id).first()
    if not progress_item: raise HTTPException(status_code=404, detail="Progress item not found")
    progress_item.completed_units = update_data.completed_units
    progress_item.total_units = update_data.total_units 
    session.add(progress_item)
    session.commit()
    session.refresh(progress_item)
    return progress_item

@router.delete("/progress/{row_id}")
def delete_progress(row_id: int, session: Session = Depends(get_db)):
    progress_item = session.query(Progress).filter(Progress.id == row_id).first()
    if not progress_item: raise HTTPException(status_code=404, detail="Progress item not found")
    session.delete(progress_item)
    session.commit()
    return {"message": "Deleted successfully"}