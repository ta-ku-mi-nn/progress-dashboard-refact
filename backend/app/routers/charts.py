from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.db.database import get_db
from app.models.models import Progress

router = APIRouter()

# 科目リスト取得APIはそのまま維持
@router.get("/subjects/{student_id}")
def get_student_subjects(
    student_id: int,
    session: Session = Depends(get_db)
) -> List[str]:
    results = (
        session.query(Progress.subject)
        .filter(Progress.student_id == student_id)
        .distinct()
        .all()
    )
    subjects = [r[0] for r in results]
    return ["全体"] + subjects

# ★修正: グラフ用データを「参考書ごとのリスト」に変更
@router.get("/progress/{student_id}")
def get_progress_chart(
    student_id: int,
    subject: Optional[str] = Query(None),
    session: Session = Depends(get_db)
) -> List[Dict[str, Any]]: # 返り値をListに変更
    query = session.query(Progress).filter(Progress.student_id == student_id)
    
    if subject and subject != "全体":
        query = query.filter(Progress.subject == subject)
    
    progress_list = query.all()
    
    response_data = []
    
    for item in progress_list:
        book_name = item.book_name
        
        # 時間(duration)が設定されていれば時間を計算、なければ単位数(units)を使用
        if item.duration and item.total_units > 0:
            # 完了時間 = (完了単位 / 全単位) * 目安時間
            total_val = item.duration
            completed_val = (item.completed_units / item.total_units) * item.duration
            unit_label = "時間 (h)"
        else:
            total_val = item.total_units
            completed_val = item.completed_units
            unit_label = "単位数"

        response_data.append({
            "book_name": book_name,
            "completed": completed_val,
            "total": total_val,
            "unit": unit_label
        })
        
    return response_data