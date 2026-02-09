from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from app.db.database import get_db
from app.models.models import Progress

router = APIRouter()

@router.get("/progress/{student_id}")
def get_progress_chart(
    student_id: int,
    subject: Optional[str] = Query(None),
    session: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    進捗チャート用データを生成します。
    """
    query = session.query(Progress).filter(Progress.student_id == student_id)
    
    if subject and subject != "全体":
        query = query.filter(Progress.subject == subject)
    
    progress_list = query.all()
    
    labels = []
    actual_data = []
    remaining_data = []
    
    for item in progress_list:
        # ★修正: item.reference_book -> item.book_name
        book_name = item.book_name 
        
        completed = item.completed_units
        total = item.total_units
        remaining = max(0, total - completed)
        
        labels.append(book_name)
        actual_data.append(completed)
        remaining_data.append(remaining)
        
    return {
        "labels": labels,
        "datasets": [
            {
                "label": "完了",
                "data": actual_data,
                "color": "#4caf50" 
            },
            {
                "label": "未完了",
                "data": remaining_data,
                "color": "#e0e0e0" 
            }
        ]
    }