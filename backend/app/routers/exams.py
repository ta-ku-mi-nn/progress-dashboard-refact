from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from app.db.database import get_db
from app.models.models import UniversityAcceptance, PastExamResult, MockExamResult

router = APIRouter()

# --- Pydantic Models (リクエストボディ用) ---

# 1. 入試日程用
class AcceptanceCreate(BaseModel):
    student_id: int
    university_name: str
    faculty_name: str
    department_name: Optional[str] = None
    exam_system: Optional[str] = None
    result: Optional[str] = "未受験"
    application_deadline: Optional[str] = None
    exam_date: Optional[str] = None
    announcement_date: Optional[str] = None
    procedure_deadline: Optional[str] = None

class AcceptanceUpdate(BaseModel):
    result: str

# 2. 過去問結果用
class PastExamCreate(BaseModel):
    student_id: int
    date: str
    university_name: str
    faculty_name: Optional[str] = None
    exam_system: Optional[str] = None
    year: int
    subject: str
    time_required: Optional[int] = None
    total_time_allowed: Optional[int] = None
    correct_answers: Optional[int] = None
    total_questions: Optional[int] = None

# 3. 模試結果用
class MockExamCreate(BaseModel):
    student_id: int
    result_type: str
    mock_exam_name: str
    mock_exam_format: str
    grade: str
    round: str
    exam_date: Optional[date] = None
    
    # 記述式スコア
    subject_kokugo_desc: Optional[int] = None
    subject_math_desc: Optional[int] = None
    subject_english_desc: Optional[int] = None
    subject_rika1_desc: Optional[int] = None
    subject_rika2_desc: Optional[int] = None
    subject_shakai1_desc: Optional[int] = None
    subject_shakai2_desc: Optional[int] = None
    
    # マーク式スコア
    subject_kokugo_mark: Optional[int] = None
    subject_math1a_mark: Optional[int] = None
    subject_math2bc_mark: Optional[int] = None
    subject_english_r_mark: Optional[int] = None
    subject_english_l_mark: Optional[int] = None
    subject_rika1_mark: Optional[int] = None
    subject_rika2_mark: Optional[int] = None
    subject_shakai1_mark: Optional[int] = None
    subject_shakai2_mark: Optional[int] = None
    subject_rika_kiso1_mark: Optional[int] = None
    subject_rika_kiso2_mark: Optional[int] = None
    subject_info_mark: Optional[int] = None

# --- API Endpoints ---

# === 1. 入試日程 (UniversityAcceptance) ===
@router.get("/acceptance/{student_id}")
def get_acceptances(student_id: int, session: Session = Depends(get_db)):
    return session.query(UniversityAcceptance).filter(
        UniversityAcceptance.student_id == student_id
    ).order_by(UniversityAcceptance.exam_date).all()

@router.post("/acceptance")
def create_acceptance(data: AcceptanceCreate, session: Session = Depends(get_db)):
    new_item = UniversityAcceptance(**data.dict())
    session.add(new_item)
    session.commit()
    session.refresh(new_item)
    return new_item

@router.patch("/acceptance/{row_id}")
def update_acceptance_result(row_id: int, data: AcceptanceUpdate, session: Session = Depends(get_db)):
    item = session.query(UniversityAcceptance).filter(UniversityAcceptance.id == row_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.result = data.result
    session.commit()
    return item

@router.delete("/acceptance/{row_id}")
def delete_acceptance(row_id: int, session: Session = Depends(get_db)):
    item = session.query(UniversityAcceptance).filter(UniversityAcceptance.id == row_id).first()
    if item:
        session.delete(item)
        session.commit()
    return {"message": "deleted"}


# === 2. 過去問結果 (PastExamResult) ===
@router.get("/pastexam/{student_id}")
def get_past_exams(student_id: int, session: Session = Depends(get_db)):
    return session.query(PastExamResult).filter(
        PastExamResult.student_id == student_id
    ).order_by(PastExamResult.date.desc()).all()

@router.post("/pastexam")
def create_past_exam(data: PastExamCreate, session: Session = Depends(get_db)):
    new_item = PastExamResult(**data.dict())
    session.add(new_item)
    session.commit()
    session.refresh(new_item)
    return new_item

@router.delete("/pastexam/{row_id}")
def delete_past_exam(row_id: int, session: Session = Depends(get_db)):
    item = session.query(PastExamResult).filter(PastExamResult.id == row_id).first()
    if item:
        session.delete(item)
        session.commit()
    return {"message": "deleted"}


# === 3. 模試結果 (MockExamResult) ===
@router.get("/mock/{student_id}")
def get_mock_exams(student_id: int, session: Session = Depends(get_db)):
    return session.query(MockExamResult).filter(
        MockExamResult.student_id == student_id
    ).order_by(MockExamResult.exam_date.desc()).all()

@router.post("/mock")
def create_mock_exam(data: MockExamCreate, session: Session = Depends(get_db)):
    new_item = MockExamResult(**data.dict())
    session.add(new_item)
    session.commit()
    session.refresh(new_item)
    return new_item

@router.delete("/mock/{row_id}")
def delete_mock_exam(row_id: int, session: Session = Depends(get_db)):
    item = session.query(MockExamResult).filter(MockExamResult.id == row_id).first()
    if item:
        session.delete(item)
        session.commit()
    return {"message": "deleted"}
