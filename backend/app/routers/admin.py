from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.database import get_db
from app.routers import deps
from app.schemas import schemas
from app.models import models
from app.crud import crud_master, crud_user, crud_student

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
        print("DEBUG: Fetching all mock exams via models.MockExam")
        
        # models.MockExam と models.User を使用してクエリ
        # gradeカラムが存在しない場合を考慮し、まずは確実に存在するカラムで取得
        query = db.query(
            models.MockExam.id,
            models.MockExam.exam_name,
            models.MockExam.subject,
            models.MockExam.score,
            models.MockExam.deviation,
            models.MockExam.exam_date,
            models.User.username.label("student_name"),
            # Userモデルにgradeがあるか不明なため、一旦ここでは取得せず後で処理
        ).join(models.User, models.MockExam.user_id == models.User.id)\
         .order_by(models.MockExam.exam_date.desc())
        
        results = query.all()
        
        final_results = []
        for r in results:
            # 各レコードのuserオブジェクトを個別に参照してgradeを確認（エラー回避用）
            user_obj = db.query(models.User).filter(models.User.username == r.student_name).first()
            # grade属性があれば取得、なければ "不明" にする
            grade = getattr(user_obj, "grade", "不明")

            final_results.append({
                "id": r.id,
                "student_name": r.student_name,
                "student_grade": grade,
                "exam_name": r.exam_name,
                "subject": r.subject,
                "score": r.score,
                "deviation": r.deviation,
                "exam_date": r.exam_date.strftime('%Y-%m-%d') if r.exam_date else None
            })

        return final_results

    except Exception as e:
        print("ERROR in get_all_mock_exams:")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Internal Server Error: {str(e)}"
        )