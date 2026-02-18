from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.database import get_db
from app.routers import deps
from app.schemas import schemas
from app.models import models
from app.crud import crud_master, crud_user, crud_student
import traceback

router = APIRouter()

# Dependency to check if user is admin
def get_current_admin(current_user: models.User = Depends(deps.get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# 1. 新規登録
@router.post("/textbooks")
def create_textbook(
    data: schemas.MasterTextbookCreate, 
    session: Session = Depends(get_db)
):
    # 重複チェック
    existing = session.query(models.MasterTextbook).filter(
        models.MasterTextbook.book_name == data.book_name,
        models.MasterTextbook.subject == data.subject
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Textbook already exists")

    new_book = models.MasterTextbook(
        subject=data.subject,
        level=data.level,
        book_name=data.book_name,
        duration=data.duration
    )
    session.add(new_book)
    session.commit()
    session.refresh(new_book)
    return new_book

# 2. 更新
@router.patch("/textbooks/{book_id}")
def update_textbook(
    book_id: int,
    data: schemas.MasterTextbookUpdate,
    session: Session = Depends(get_db)
):
    book = session.query(models.MasterTextbook).filter(models.MasterTextbook.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Textbook not found")
    
    if data.subject is not None:
        book.subject = data.subject
    if data.level is not None:
        book.level = data.level
    if data.book_name is not None:
        book.book_name = data.book_name
    if data.duration is not None:
        book.duration = data.duration

    session.commit()
    session.refresh(book)
    return book

# 3. 削除
@router.delete("/textbooks/{book_id}")
def delete_textbook(book_id: int, session: Session = Depends(get_db)):
    book = session.query(models.MasterTextbook).filter(models.MasterTextbook.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Textbook not found")
    
    session.delete(book)
    session.commit()
    return {"message": "Deleted successfully"}

# --- Preset Management API ---

# 1. プリセット一覧取得
@router.get("/presets")
def get_admin_presets(session: Session = Depends(get_db)):
    presets = session.query(models.BulkPreset).options(joinedload(models.BulkPreset.books)).all()
    # シンプルな形式で返す
    return [
        {
            "id": p.id,
            "preset_name": p.preset_name,
            "subject": p.subject,
            "books": [b.book_name for b in p.books]
        }
        for p in presets
    ]

# 2. プリセット作成
@router.post("/presets")
def create_preset(
    data: schemas.BulkPresetCreate,
    session: Session = Depends(get_db)
):
    # 重複チェック
    existing = session.query(models.BulkPreset).filter(
        models.BulkPreset.subject == data.subject,
        models.BulkPreset.preset_name == data.preset_name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Preset already exists")

    # プリセット親作成
    new_preset = models.BulkPreset(
        subject=data.subject,
        preset_name=data.preset_name
    )
    session.add(new_preset)
    session.flush() # ID生成のため

    # 子（本）作成
    for book_name in data.book_names:
        new_book = models.BulkPresetBook(
            preset_id=new_preset.id,
            book_name=book_name
        )
        session.add(new_book)
    
    session.commit()
    return {"message": "Preset created successfully"}

# 3. プリセット削除
@router.delete("/presets/{preset_id}")
def delete_preset(preset_id: int, session: Session = Depends(get_db)):
    preset = session.query(models.BulkPreset).filter(models.BulkPreset.id == preset_id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    
    session.delete(preset)
    session.commit()
    return {"message": "Deleted successfully"}

@router.put("/presets/{preset_id}")
def update_preset(
    preset_id: int,
    data: schemas.BulkPresetUpdate,
    session: Session = Depends(get_db)
):
    preset = session.query(models.BulkPreset).filter(models.BulkPreset.id == preset_id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    if data.preset_name is not None:
        preset.preset_name = data.preset_name
    if data.subject is not None:
        preset.subject = data.subject
    
    if data.book_names is not None:
        # 既存の紐付けを削除して再登録
        session.query(models.BulkPresetBook).filter(models.BulkPresetBook.preset_id == preset.id).delete()
        for book_name in data.book_names:
            new_book = models.BulkPresetBook(
                preset_id=preset.id,
                book_name=book_name
            )
            session.add(new_book)
            
    session.commit()
    return {"message": "Updated successfully"}

@router.get("/users", response_model=List[schemas.User])
def read_users(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    # crud_user.get_users needed
    return db.query(models.User).offset(skip).limit(limit).all()

@router.post("/users", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    db_user = crud_user.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud_user.create_user(db, user=user)

@router.post("/students", response_model=schemas.Student)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    # Check if student already exists? Unique constraint on (school, name) handles it,
    # but we might want to check nicely.
    # crud_external has get_student_id_by_name usable here?
    # db_student = crud_external.get_student_id_by_name(db, student.school, student.name)
    # if db_student: raise HTTPException...
    # For now, let DB constraint handle it or catch IntegrityError.
    return crud_student.create_student(db, student)

# Add other admin endpoints (delete user, etc.) as needed

@router.get("/mock_exams")
def get_all_mock_exams(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user)
):
    try:
        # MockExamResult -> Student -> User の順に結合して取得
        results = db.query(
            models.MockExamResult,
            models.User.username.label("student_name")
        ).join(models.Student, models.MockExamResult.student_id == models.Student.id)\
         .join(models.User, models.Student.user_id == models.User.id)\
         .order_by(models.MockExamResult.exam_date.desc()).all()
        
        final_list = []

        # 1つのレコード（1回の模試）から各科目のデータを抽出してリスト化
        for record, student_name in results:
            # 抽出したい科目とカラムの対応表
            # (表示名, 記述式のカラム, マーク式のカラム)
            subject_map = [
                ("英語", "subject_english_desc", "subject_english_r_mark"),
                ("数学", "subject_math_desc", "subject_math1a_mark"),
                ("国語", "subject_kokugo_desc", "subject_kokugo_mark"),
                ("理科", "subject_rika1_desc", "subject_rika1_mark"),
                ("社会", "subject_shakai1_desc", "subject_shakai1_mark"),
            ]

            for label, desc_col, mark_col in subject_map:
                # 記述かマーク、どちらかに点数があればデータを作成
                score_desc = getattr(record, desc_col, None)
                score_mark = getattr(record, mark_col, None)
                
                # 点数が存在する場合のみリストに追加
                if score_desc is not None or score_mark is not None:
                    final_list.append({
                        "id": f"{record.id}_{label}", # 一意のID
                        "student_name": student_name,
                        "student_grade": record.grade,
                        "exam_name": f"{record.mock_exam_name} ({record.round}回)",
                        "subject": label,
                        "score": score_desc if score_desc is not None else score_mark,
                        "deviation": None, # 現在のモデルに偏差値カラムがないためNone
                        "exam_date": record.exam_date.strftime('%Y-%m-%d') if record.exam_date else "不明"
                    })

        return final_list

    except Exception as e:
        print("ERROR in get_all_mock_exams:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")