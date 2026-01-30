from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.routers import deps
from app.schemas import schemas
from app.models.models import User
from app.crud import crud_master, crud_user, crud_student

router = APIRouter()

# Dependency to check if user is admin
def get_current_admin(current_user: User = Depends(deps.get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.post("/textbooks", response_model=schemas.MasterTextbook)
def create_textbook(
    textbook: schemas.MasterTextbookCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return crud_master.create_master_textbook(db, textbook)

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
