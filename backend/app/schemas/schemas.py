from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import date

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    role: str = "user"
    school: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

# --- Student Schemas ---
class StudentBase(BaseModel):
    name: str
    school: str
    deviation_value: Optional[int] = None
    target_level: Optional[str] = None
    grade: Optional[str] = None
    previous_school: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    # Instructors can be fetched separately or included if needed
    
    class Config:
        orm_mode = True

# --- StudentInstructor Schemas ---
class StudentInstructorBase(BaseModel):
    student_id: int
    user_id: int
    is_main: int = 0

class StudentInstructorCreate(StudentInstructorBase):
    pass

class StudentInstructor(StudentInstructorBase):
    id: int

    class Config:
        orm_mode = True

# --- MasterTextbook Schemas ---
class MasterTextbookBase(BaseModel):
    level: str
    subject: str
    book_name: str
    duration: Optional[float] = None

class MasterTextbookCreate(MasterTextbookBase):
    pass

class MasterTextbook(MasterTextbookBase):
    id: int

    class Config:
        orm_mode = True

# --- Progress Schemas ---
class ProgressBase(BaseModel):
    student_id: int
    subject: str
    level: str
    book_name: str
    duration: Optional[float] = None
    is_planned: Optional[bool] = None
    is_done: Optional[bool] = None
    completed_units: int = 0
    total_units: int = 1

class ProgressCreate(ProgressBase):
    pass

class ProgressUpdate(BaseModel):
    # For bulk updates, we might need a looser schema
    subject: str
    level: str
    book_name: str
    duration: Optional[float] = None
    is_planned: Optional[bool] = None
    is_done: Optional[bool] = None
    completed_units: Optional[int] = None
    total_units: Optional[int] = None

class Progress(ProgressBase):
    id: int

    class Config:
        orm_mode = True

# --- Homework Schemas ---
class HomeworkBase(BaseModel):
    student_id: int
    master_textbook_id: Optional[int] = None
    custom_textbook_name: Optional[str] = None
    subject: str
    task: str
    task_date: str
    task_group_id: Optional[str] = None
    status: str = '未着手'
    other_info: Optional[str] = None

class HomeworkCreate(HomeworkBase):
    pass

class Homework(HomeworkBase):
    id: int
    textbook_name: Optional[str] = None # Helper field for frontend

    class Config:
        orm_mode = True

# --- Past Exam Result Schemas ---
class PastExamResultBase(BaseModel):
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

class PastExamResultCreate(PastExamResultBase):
    pass

class PastExamResult(PastExamResultBase):
    id: int

    class Config:
        orm_mode = True

# --- University Acceptance Schemas ---
class UniversityAcceptanceBase(BaseModel):
    student_id: int
    university_name: str
    faculty_name: str
    department_name: Optional[str] = None
    exam_system: Optional[str] = None
    result: Optional[str] = None
    application_deadline: Optional[str] = None
    exam_date: Optional[str] = None
    announcement_date: Optional[str] = None
    procedure_deadline: Optional[str] = None

class UniversityAcceptanceCreate(UniversityAcceptanceBase):
    pass

class UniversityAcceptance(UniversityAcceptanceBase):
    id: int

    class Config:
        orm_mode = True

# --- Mock Exam Result Schemas ---
class MockExamResultBase(BaseModel):
    student_id: int
    result_type: str
    mock_exam_name: str
    mock_exam_format: str
    grade: str
    round: str
    exam_date: Optional[date] = None

    subject_kokugo_desc: Optional[int] = None
    subject_math_desc: Optional[int] = None
    subject_english_desc: Optional[int] = None
    subject_rika1_desc: Optional[int] = None
    subject_rika2_desc: Optional[int] = None
    subject_shakai1_desc: Optional[int] = None
    subject_shakai2_desc: Optional[int] = None
    
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

class MockExamResultCreate(MockExamResultBase):
    pass

class MockExamResult(MockExamResultBase):
    id: int

    class Config:
        orm_mode = True

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
