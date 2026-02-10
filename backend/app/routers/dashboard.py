from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Dict, Any, List
from pydantic import BaseModel
from app.db.database import get_db
from app.models.models import Progress, EikenResult, MasterTextbook, BulkPreset, BulkPresetBook

router = APIRouter()

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

    # 1. マスタID指定の登録
    for book_id in data.book_ids:
        master_book = session.query(MasterTextbook).filter(MasterTextbook.id == book_id).first()
        if not master_book:
            continue
            
        # 重複チェック
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
            total_units=1 
        )
        session.add(new_progress)
        added_items.append(new_progress)

    # 2. カスタム登録
    for custom in data.custom_books:
        # 重複チェック (同名・同科目が既にないか)
        exists = session.query(Progress).filter(
            Progress.student_id == data.student_id,
            Progress.book_name == custom.book_name,
            Progress.subject == custom.subject
        ).first()

        if exists:
            continue

        new_progress = Progress(
            student_id=data.student_id,
            subject=custom.subject,
            level=custom.level,
            book_name=custom.book_name,
            duration=custom.duration,
            is_planned=True,
            is_done=False,
            completed_units=0,
            total_units=1 # デフォルト
        )
        session.add(new_progress)
        added_items.append(new_progress)
    
    session.commit()
    return {"message": f"{len(added_items)} items added"}

@router.get("/presets")
def get_presets(session: Session = Depends(get_db)):
    # プリセットと、それに紐づく本の名前を取得
    presets = session.query(BulkPreset).options(joinedload(BulkPreset.books)).all()
    
    # 全マスタデータを取得して辞書化 (検索高速化)
    # key: (subject, book_name), value: MasterTextbook object
    all_masters = session.query(MasterTextbook).all()
    master_map = { (m.subject, m.book_name): m for m in all_masters }

    result = []
    for p in presets:
        books_data = []
        for pb in p.books:
            # マスタに存在するかチェック
            # プリセットにはsubjectがあるため、それを使って検索
            key = (p.subject, pb.book_name)
            master_info = master_map.get(key)

            if master_info:
                # マスタにある場合 -> マスタIDや詳細情報をセット
                books_data.append({
                    "id": master_info.id,
                    "subject": master_info.subject,
                    "level": master_info.level,
                    "book_name": master_info.book_name,
                    "duration": master_info.duration,
                    "is_master": True
                })
            else:
                # マスタにない場合 -> 名前だけのカスタム扱い
                books_data.append({
                    "id": None, # マスタIDなし
                    "subject": p.subject,
                    "level": "プリセット", # 仮のレベル
                    "book_name": pb.book_name,
                    "duration": 0, # 不明
                    "is_master": False
                })
        
        result.append({
            "id": p.id,
            "name": p.preset_name, # モデル定義に合わせて preset_name
            "subject": p.subject,
            "books": books_data
        })
        
    return result
