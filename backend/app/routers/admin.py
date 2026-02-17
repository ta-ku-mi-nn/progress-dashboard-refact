from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.routers import deps
from app.schemas import schemas
from app.models.models import User, MasterTextbook
from app.crud import crud_master, crud_user, crud_student

router = APIRouter()

# Dependency to check if user is admin
def get_current_admin(current_user: User = Depends(deps.get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# 1. 新規登録
@router.post("/textbooks")
def create_textbook(
    data: MasterTextbookCreate, 
    session: Session = Depends(get_db)
):
    # 重複チェック
    existing = session.query(MasterTextbook).filter(
        MasterTextbook.book_name == data.book_name,
        MasterTextbook.subject == data.subject
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Textbook already exists")

    new_book = MasterTextbook(
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
    data: MasterTextbookUpdate,
    session: Session = Depends(get_db)
):
    book = session.query(MasterTextbook).filter(MasterTextbook.id == book_id).first()
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
    book = session.query(MasterTextbook).filter(MasterTextbook.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Textbook not found")
    
    session.delete(book)
    session.commit()
    return {"message": "Deleted successfully"}

@router.get("/users", response_model=List[schemas.User])
def read_users(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # crud_user.get_users needed
    return db.query(User).offset(skip).limit(limit).all()

@router.post("/users", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    db_user = crud_user.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud_user.create_user(db, user=user)

@router.post("/students", response_model=schemas.Student)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # Check if student already exists? Unique constraint on (school, name) handles it,
    # but we might want to check nicely.
    # crud_external has get_student_id_by_name usable here?
    # db_student = crud_external.get_student_id_by_name(db, student.school, student.name)
    # if db_student: raise HTTPException...
    # For now, let DB constraint handle it or catch IntegrityError.
    return crud_student.create_student(db, student)

# Add other admin endpoints (delete user, etc.) as needed
