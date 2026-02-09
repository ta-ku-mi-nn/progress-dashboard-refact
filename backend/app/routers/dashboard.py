from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Dict, Any, List
from pydantic import BaseModel
from app.db.database import get_db
from app.models.models import Progress, EikenResult 

router = APIRouter()

class ProgressUpdate(BaseModel):
    completed_units: int

@router.get("/summary/{student_id}")
def get_dashboard_summary(
    student_id: int, 
    session: Session = Depends(get_db)
) -> Dict[str, Any]:
    # 1. 全体進捗率
    progress_items = session.query(Progress).filter(Progress.student_id == student_id).all()
    
    total_progress_pct = 0.0
    if progress_items:
        valid_items = [p for p in progress_items if p.total_units > 0]
        if valid_items:
            ratios = [p.completed_units / p.total_units for p in valid_items]
            total_progress_pct = (sum(ratios) / len(ratios)) * 100

    # 2. 最新英検結果
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
            "cse_score": latest_eiken.cse_score, # モデル定義に合わせてください (cse_scoreならcse_score)
            "result": latest_eiken.result
        }

    return {
        "total_progress": round(total_progress_pct, 1),
        "latest_eiken": eiken_data
    }

# ★追加: 参考書リスト取得用エンドポイント
@router.get("/list/{student_id}")
def get_progress_list(
    student_id: int,
    session: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    items = session.query(Progress).filter(Progress.student_id == student_id).all()
    return [
        {
            "id": item.id,
            "subject": item.subject,
            "book_name": item.book_name, # ★修正: book_nameを使用
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
    session.add(progress_item)
    session.commit()
    session.refresh(progress_item)
    return progress_item
