# backend/app/routers/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

from app.db.database import get_db
# Student モデルを含むようにインポート
from app.models.models import Progress, EikenResult, MasterTextbook, BulkPreset, BulkPresetBook, User, Student

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- Pydantic Schemas ---
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

# --- Endpoints ---

@router.get("/{student_id}", response_model=DashboardData)
def get_dashboard_data(student_id: int, session: Session = Depends(get_db)):
    # 1. 生徒存在確認
    student = session.query(Student).filter(Student.id == student_id).first()
    if not student:
        student = session.query(User).filter(User.id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. 進捗アイテム取得
    progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
    
    total_completed_time = 0.0
    total_planned_time = 0.0
    
    # 達成率計算用
    weighted_progress_sum = 0.0 # (進捗率 * 時間) の合計
    total_duration_for_rate = 0.0 # 時間の合計
    
    simple_ratios = [] # 時間がない場合の予備用

    if progress_items:
        # マスターデータのキャッシュを作成（N+1問題回避のため）
        all_masters = session.query(MasterTextbook).all()
        master_map = { (m.subject, m.book_name): m.duration for m in all_masters }

        for item in progress_items:
            # durationの取得（データになければマスターから補完）
            duration = item.duration
            if (duration is None or duration <= 0) and item.subject and item.book_name:
                duration = master_map.get((item.subject, item.book_name), 0.0)
                # 補完できた場合はDBも更新しておくと良いが、今回は計算のみに使用
            
            duration = float(duration or 0)

            # 進捗率 (0.0 ~ 1.0)
            ratio = 0.0
            if (item.total_units or 0) > 0:
                ratio = min(1.0, (item.completed_units or 0) / item.total_units)
            
            # リストに追加 (時間がない場合の単純平均用)
            simple_ratios.append(ratio)

            # 計算加算
            if duration > 0:
                total_planned_time += duration
                total_completed_time += ratio * duration
                
                weighted_progress_sum += ratio * duration
                total_duration_for_rate += duration

    # 達成率の計算
    total_progress_pct = 0.0
    
    if total_duration_for_rate > 0:
        # 時間の重み付け平均
        total_progress_pct = (weighted_progress_sum / total_duration_for_rate) * 100
    elif len(simple_ratios) > 0:
        # 時間設定が全くない場合は単純平均
        total_progress_pct = (sum(simple_ratios) / len(simple_ratios)) * 100

    # ログ出力（デバッグ用）
    logger.info(f"Student {student_id}: Planned={total_planned_time}, Completed={total_completed_time}, Rate={total_progress_pct}")

    # 3. 英検結果取得
    latest_eiken = (
        session.query(EikenResult)
        .filter(EikenResult.student_id == student_id)
        .order_by(desc(EikenResult.exam_date))
        .first()
    )
    
    eiken_grade = "未登録"
    eiken_score = "-"
    eiken_date = "-"

    if latest_eiken:
        eiken_grade = latest_eiken.grade or "未登録"
        eiken_score = str(latest_eiken.cse_score) if latest_eiken.cse_score is not None else "-"
        eiken_date = str(latest_eiken.exam_date) if latest_eiken.exam_date else "-"

    return {
        "student_id": student.id,
        "total_study_time": round(total_completed_time, 1),
        "total_planned_time": round(total_planned_time, 1),
        "progress_rate": round(total_progress_pct, 1),
        "eiken_grade": eiken_grade,
        "eiken_score": eiken_score,
        "eiken_date": eiken_date
    }

# --- グラフ用API ---

@router.get("/chart/{student_id}")
def get_subject_chart(student_id: int, session: Session = Depends(get_db)):
    items = session.query(Progress).filter(Progress.student_id == student_id).all()
    subject_stats = {} 
    
    # マスターデータのマップ作成
    all_masters = session.query(MasterTextbook).all()
    master_map = { (m.subject, m.book_name): m.duration for m in all_masters }

    for item in items:
        if (item.total_units or 0) <= 0:
            continue

        subj = item.subject or "その他"
        if subj not in subject_stats:
            subject_stats[subj] = {"planned": 0.0, "completed": 0.0, "ratios": []}

        # duration補完
        duration = item.duration
        if (duration is None or duration <= 0) and item.subject and item.book_name:
            duration = master_map.get((item.subject, item.book_name), 0.0)
        duration = float(duration or 0)

        ratio = min(1.0, (item.completed_units or 0) / item.total_units)
        subject_stats[subj]["ratios"].append(ratio * 100)
        
        if duration > 0:
            subject_stats[subj]["planned"] += duration
            subject_stats[subj]["completed"] += ratio * duration
            
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

# --- 既存のCRUD系API ---

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
        if not master_book: continue
        exists = session.query(Progress).filter(Progress.student_id == data.student_id, Progress.book_name == master_book.book_name).first()
        if exists: continue

        new_progress = Progress(
            student_id=data.student_id,
            subject=master_book.subject,
            level=master_book.level,
            book_name=master_book.book_name,
            duration=master_book.duration, # ここで入るはずだが、念のため
            is_planned=True, is_done=False, completed_units=0, total_units=1 
        )
        session.add(new_progress)
        added_items.append(new_progress)

    for custom in data.custom_books:
        exists = session.query(Progress).filter(Progress.student_id == data.student_id, Progress.book_name == custom.book_name).first()
        if exists: continue
        new_progress = Progress(
            student_id=data.student_id,
            subject=custom.subject,
            level=custom.level,
            book_name=custom.book_name,
            duration=custom.duration,
            is_planned=True, is_done=False, completed_units=0, total_units=1 
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
                    "id": None, "subject": p.subject, "level": "プリセット", 
                    "book_name": pb.book_name, "duration": 0, "is_master": False
                })
        result.append({"id": p.id, "name": p.preset_name, "subject": p.subject, "books": books_data})
    return result

@router.delete("/progress/{row_id}")
def delete_progress(row_id: int, session: Session = Depends(get_db)):
    progress_item = session.query(Progress).filter(Progress.id == row_id).first()
    if not progress_item:
        raise HTTPException(status_code=404, detail="Progress item not found")
    session.delete(progress_item)
    session.commit()
    return {"message": "Deleted successfully"}