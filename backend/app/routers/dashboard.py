from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Dict, Any, List
from pydantic import BaseModel
from app.db.database import get_db
from app.models.models import Progress, EikenResult, MasterTextbook

router = APIRouter()

class ProgressUpdate(BaseModel):
    completed_units: int
    total_units: int

class ProgressCreate(BaseModel):
    student_id: int
    book_ids: List[int] # マスタのIDリスト

@router.get("/summary/{student_id}")
def get_dashboard_summary(
    student_id: int, 
    session: Session = Depends(get_db)
) -> Dict[str, Any]:
    # 全データを取得
    progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
    
    total_progress_pct = 0.0
    total_planned_time = 0.0
    total_completed_time = 0.0
    
    if progress_items:
        # 1. 進捗率の平均 (従来通り)
        valid_items_for_pct = [p for p in progress_items if p.total_units > 0]
        if valid_items_for_pct:
            ratios = [p.completed_units / p.total_units for p in valid_items_for_pct]
            total_progress_pct = (sum(ratios) / len(ratios)) * 100
        
        # 2. ★追加: 時間の計算
        for item in progress_items:
            # duration(目安時間)が設定されている場合のみ計算
            if item.duration and item.duration > 0 and item.total_units > 0:
                # 予定総時間
                total_planned_time += item.duration
                # 達成済時間 = (進捗率) * 目安時間
                ratio = min(1.0, item.completed_units / item.total_units) # 100%を超えないように
                total_completed_time += ratio * item.duration

    # 3. 最新英検結果
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
            "result": latest_eiken.result
        }

    return {
        "total_progress": round(total_progress_pct, 1),
        "total_planned_time": round(total_planned_time, 1),   # ★追加
        "total_completed_time": round(total_completed_time, 1), # ★追加
        "latest_eiken": eiken_data
    }

# ... (以下の get_progress_list や update_progress は変更なし) ...
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

# 進捗更新API (分母更新対応)
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
    progress_item.total_units = update_data.total_units # 分母も更新
    
    session.add(progress_item)
    session.commit()
    session.refresh(progress_item)
    return progress_item

@router.get("/books/master")
def get_master_books(session: Session = Depends(get_db)):
    # MasterTextbookテーブルから全件取得
    return session.query(MasterTextbook).all()

@router.post("/progress/batch")
def add_progress_batch(
    data: ProgressCreate,
    session: Session = Depends(get_db)
):
    added_items = []
    for book_id in data.book_ids:
        # マスタから情報を取得
        master_book = session.query(MasterTextbook).filter(MasterTextbook.id == book_id).first()
        if not master_book:
            continue
            
        # Progressに追加
        # 重複チェック: 同じ生徒が同じ参考書を既に持っていないか確認
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
            total_units=1 # マスタにデフォルト値がないため仮で1を設定
        )
        session.add(new_progress)
        added_items.append(new_progress)
    
    session.commit()
    return {"message": f"{len(added_items)} items added"}
