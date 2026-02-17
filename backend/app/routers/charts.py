from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.db.database import get_db
from app.models.models import Progress

router = APIRouter()

# 科目リスト取得API (変更なし)
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

# チャートデータ取得API (修正)
@router.get("/progress/{student_id}")
def get_progress_chart(
    student_id: int,
    subject: Optional[str] = Query(None),
    session: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    query = session.query(Progress).filter(Progress.student_id == student_id)
    
    # 科目フィルタリング (全体以外の場合)
    if subject and subject != "全体":
        query = query.filter(Progress.subject == subject)
    
    progress_list = query.all()
    
    # --- 集計ロジック ---
    if subject == "全体" or subject is None:
        # 【全体モード】科目ごとに集計
        aggregated_data = {}
        for item in progress_list:
            subj_name = item.subject
            
            # 時間(duration)があれば使用、なければ単位数
            if item.duration and item.total_units > 0:
                total_val = item.duration
                completed_val = (item.completed_units / item.total_units) * item.duration
            else:
                total_val = item.total_units
                completed_val = item.completed_units

            if subj_name not in aggregated_data:
                aggregated_data[subj_name] = {"completed": 0.0, "total": 0.0}
            
            aggregated_data[subj_name]["completed"] += completed_val
            aggregated_data[subj_name]["total"] += total_val
        
        # リスト形式に変換 (keyをnameとする)
        response_data = []
        for subj_name, data in aggregated_data.items():
            response_data.append({
                "name": subj_name,     # 積み上げ要素名（科目名）
                "completed": data["completed"],
                "total": data["total"],
                "type": "subject"
            })
            
    else:
        # 【個別科目モード】参考書ごとにリスト化
        response_data = []
        for item in progress_list:
            book_name = item.book_name
            
            if item.duration and item.total_units > 0:
                total_val = item.duration
                completed_val = (item.completed_units / item.total_units) * item.duration
            else:
                total_val = item.total_units
                completed_val = item.completed_units

            response_data.append({
                "name": book_name,     # 積み上げ要素名（参考書名）
                "completed": completed_val,
                "total": total_val,
                "type": "book"
            })

    return response_data
