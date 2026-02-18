# backend/app/routers/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.database import get_db
from app.models.models import Progress, EikenResult, MasterTextbook, BulkPreset, BulkPresetBook, User

router = APIRouter()

# --- Pydantic Schemas ---
# フロントエンドに返すデータの型を厳格に定義します
class DashboardData(BaseModel):
    student_id: int
    total_study_time: float      # 総学習時間（完了した時間）
    total_planned_time: float    # 学習予定（全教材の目安時間の合計）
    progress_rate: float         # 達成率（%）
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
    # UserテーブルかStudentテーブルか、環境に合わせて調整（今回はUserで検索後、なければStudentも考慮など不要ならシンプルに）
    # ここでは既存コードに合わせてUserテーブルから検索します
    student = session.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. 進捗アイテム取得
    progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
    
    total_completed_time = 0.0
    total_planned_time = 0.0
    total_progress_pct = 0.0
    
    # === ★計算ロジック修正箇所 ===
    if progress_items:
        # 時間設定(duration)があるアイテムの計算
        for item in progress_items:
            # durationがある場合のみ加算
            if item.duration and item.duration > 0:
                total_planned_time += item.duration
                
                # 完了時間の計算 (進捗率 * duration)
                if (item.total_units or 0) > 0:
                    ratio = min(1.0, (item.completed_units or 0) / item.total_units)
                    total_completed_time += ratio * item.duration

        # 達成率の計算
        if total_planned_time > 0:
            # 時間設定がある場合: (完了時間 / 予定時間) * 100
            total_progress_pct = (total_completed_time / total_planned_time) * 100
        else:
            # 時間設定が全くない場合のフォールバック: (各教材の進捗率の単純平均)
            valid_items = [p for p in progress_items if (p.total_units or 0) > 0]
            if valid_items:
                ratios = [min(1.0, (p.completed_units or 0) / p.total_units) for p in valid_items]
                total_progress_pct = (sum(ratios) / len(ratios)) * 100
            else:
                total_progress_pct = 0.0
    
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

    # 型定義(DashboardData)に合わせてデータを返す
    return {
        "student_id": student.id,
        "total_study_time": round(total_completed_time, 1),
        "total_planned_time": round(total_planned_time, 1),
        "progress_rate": round(total_progress_pct, 1),
        "eiken_grade": eiken_grade,
        "eiken_score": eiken_score,
        "eiken_date": eiken_date
    }


# --- 以下、グラフ用APIなどもロジックを合わせる ---

@router.get("/chart/{student_id}")
def get_subject_chart(student_id: int, session: Session = Depends(get_db)):
    items = session.query(Progress).filter(Progress.student_id == student_id).all()
    subject_stats = {} # {subj: {"planned": 0.0, "completed": 0.0, "ratios": []}}
    
    for item in items:
        if (item.total_units or 0) <= 0:
            continue

        subj = item.subject or "その他"
        if subj not in subject_stats:
            subject_stats[subj] = {"planned": 0.0, "completed": 0.0, "ratios": []}

        ratio = min(1.0, (item.completed_units or 0) / item.total_units)
        subject_stats[subj]["ratios"].append(ratio * 100) # 単純平均用
        
        if item.duration and item.duration > 0:
            subject_stats[subj]["planned"] += item.duration
            subject_stats[subj]["completed"] += ratio * item.duration
            
    result = []
    for subj, stats in subject_stats.items():
        if stats["planned"] > 0:
            # 時間ベース
            avg_progress = (stats["completed"] / stats["planned"]) * 100
        elif stats["ratios"]:
            # 単純平均ベース
            avg_progress = sum(stats["ratios"]) / len(stats["ratios"])
        else:
            avg_progress = 0.0
            
        result.append({
            "subject": subj,
            "progress": round(avg_progress, 1)
        })
        
    return result

# --- 既存のCRUD系API（変更なし） ---

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
    # 既存のロジック維持
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
            duration=master_book.duration,
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