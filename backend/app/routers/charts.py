from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.db.database import get_db
# ★追加: MasterTextbook をインポート
from app.models.models import Progress, MasterTextbook

router = APIRouter()

# 科目リスト取得API
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

# チャートデータ取得API
@router.get("/progress/{student_id}")
def get_progress_chart(
    student_id: int,
    subject: Optional[str] = Query(None),
    session: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    query = session.query(Progress).filter(Progress.student_id == student_id)
    
    if subject and subject != "全体":
        query = query.filter(Progress.subject == subject)
    
    progress_list = query.all()
    
    # ★追加: マスターデータのマップ作成 (duration補完用)
    all_masters = session.query(MasterTextbook).all()
    master_map = { (m.subject, m.book_name): m.duration for m in all_masters }
    
    # --- 集計ロジック ---
    if subject == "全体" or subject is None:
        # 【全体モード】科目ごとに集計
        aggregated_data = {}
        for item in progress_list:
            subj_name = item.subject or "その他"
            
            # ★修正: durationが0ならマスターから補完
            duration = item.duration
            if (duration is None or duration <= 0) and item.subject and item.book_name:
                duration = master_map.get((item.subject, item.book_name), 0.0)
            duration = float(duration or 0)
            
            # ★修正: 所要時間 × 進捗(分数) で計算する
            if duration > 0 and (item.total_units or 0) > 0:
                total_val = duration
                completed_val = (item.completed_units / item.total_units) * duration
            else:
                # マスターにも時間設定がない場合の最終手段
                total_val = float(item.total_units or 0)
                completed_val = float(item.completed_units or 0)

            if subj_name not in aggregated_data:
                aggregated_data[subj_name] = {"completed": 0.0, "total": 0.0}
            
            aggregated_data[subj_name]["completed"] += completed_val
            aggregated_data[subj_name]["total"] += total_val
        
        # リスト形式に変換 (小数点第1位で丸める)
        response_data = []
        for subj_name, data in aggregated_data.items():
            response_data.append({
                "name": subj_name,
                "completed": round(data["completed"], 1),
                "total": round(data["total"], 1),
                "type": "subject"
            })
            
    else:
        # 【個別科目モード】参考書ごとにリスト化
        response_data = []
        for item in progress_list:
            book_name = item.book_name or "不明な教材"
            
            # ★修正: durationが0ならマスターから補完
            duration = item.duration
            if (duration is None or duration <= 0) and item.subject and item.book_name:
                duration = master_map.get((item.subject, item.book_name), 0.0)
            duration = float(duration or 0)
            
            # ★修正: 所要時間 × 進捗(分数) で計算する
            if duration > 0 and (item.total_units or 0) > 0:
                total_val = duration
                completed_val = (item.completed_units / item.total_units) * duration
            else:
                total_val = float(item.total_units or 0)
                completed_val = float(item.completed_units or 0)

            response_data.append({
                "name": book_name,
                "completed": round(completed_val, 1),
                "total": round(total_val, 1),
                "type": "book"
            })

    return response_data