from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session  # ★修正: sqlmodel ではなく sqlalchemy.orm から Session をインポート
from typing import List, Optional, Dict, Any
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
    subject が指定された場合はその科目でフィルタリングします。
    積み上げ棒グラフ（完了 vs 未完了）用のデータを返します。
    """
    # ★修正: session.query(...) を使用する書き方に変更
    query = session.query(Progress).filter(Progress.student_id == student_id)
    
    # "全体" 以外が選択された場合にフィルタリング
    if subject and subject != "全体":
        query = query.filter(Progress.subject == subject)
    
    progress_list = query.all()
    
    # チャート用データの加工
    labels = []
    actual_data = []
    remaining_data = []
    
    for item in progress_list:
        book_name = item.reference_book
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