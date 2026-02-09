from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, Date, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import date

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    school = Column(String)

    student_instructors = relationship("StudentInstructor", back_populates="user")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    school = Column(String, nullable=False)
    deviation_value = Column(Integer)
    target_level = Column(String)
    grade = Column(String)
    previous_school = Column(String)

    __table_args__ = (UniqueConstraint('school', 'name', name='_school_name_uc'),)

    instructors = relationship("StudentInstructor", back_populates="student", cascade="all, delete-orphan")
    progress = relationship("Progress", back_populates="student", cascade="all, delete-orphan")
    past_exam_results = relationship("PastExamResult", back_populates="student", cascade="all, delete-orphan")
    university_acceptances = relationship("UniversityAcceptance", back_populates="student", cascade="all, delete-orphan")
    mock_exam_results = relationship("MockExamResult", back_populates="student", cascade="all, delete-orphan")

class StudentInstructor(Base):
    __tablename__ = "student_instructors"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_main = Column(Integer, nullable=False, default=0)

    __table_args__ = (UniqueConstraint('student_id', 'user_id', name='_student_user_uc'),)

    student = relationship("Student", back_populates="instructors")
    user = relationship("User", back_populates="student_instructors")

class MasterTextbook(Base):
    __tablename__ = "master_textbooks"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    book_name = Column(String, nullable=False)
    duration = Column(Float)

    __table_args__ = (UniqueConstraint('subject', 'level', 'book_name', name='_subject_level_book_uc'),)

class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String, nullable=False)
    level = Column(String, nullable=False)
    book_name = Column(String, nullable=False)
    duration = Column(Float)
    is_planned = Column(Boolean)
    is_done = Column(Boolean)
    completed_units = Column(Integer, nullable=False, default=0)
    total_units = Column(Integer, nullable=False, default=1)

    __table_args__ = (UniqueConstraint('student_id', 'subject', 'level', 'book_name', name='_student_prog_uc'),)

    student = relationship("Student", back_populates="progress")



class BulkPreset(Base):
    __tablename__ = "bulk_presets"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False)
    preset_name = Column(String, nullable=False)

    __table_args__ = (UniqueConstraint('subject', 'preset_name', name='_subject_preset_uc'),)

    books = relationship("BulkPresetBook", back_populates="preset", cascade="all, delete-orphan")

class BulkPresetBook(Base):
    __tablename__ = "bulk_preset_books"

    id = Column(Integer, primary_key=True, index=True)
    preset_id = Column(Integer, ForeignKey("bulk_presets.id", ondelete="CASCADE"), nullable=False)
    book_name = Column(String, nullable=False)

    preset = relationship("BulkPreset", back_populates="books")

class PastExamResult(Base):
    __tablename__ = "past_exam_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False) # Existing is TEXT
    university_name = Column(String, nullable=False)
    faculty_name = Column(String)
    exam_system = Column(String)
    year = Column(Integer, nullable=False)
    subject = Column(String, nullable=False)
    time_required = Column(Integer)
    total_time_allowed = Column(Integer)
    correct_answers = Column(Integer)
    total_questions = Column(Integer)

    student = relationship("Student", back_populates="past_exam_results")

class UniversityAcceptance(Base):
    __tablename__ = "university_acceptance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    university_name = Column(String, nullable=False)
    faculty_name = Column(String, nullable=False)
    department_name = Column(String)
    exam_system = Column(String)
    result = Column(String) # '合格', '不合格', NULL
    application_deadline = Column(String)
    exam_date = Column(String)
    announcement_date = Column(String)
    procedure_deadline = Column(String)

    student = relationship("Student", back_populates="university_acceptances")

class FeatureRequest(Base):
    __tablename__ = "feature_requests"

    id = Column(Integer, primary_key=True, index=True)
    reporter_username = Column(String, nullable=False)
    report_date = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, nullable=False, default='未対応')
    resolution_message = Column(Text)

class BugReport(Base):
    __tablename__ = "bug_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_username = Column(String, nullable=False)
    report_date = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, nullable=False, default='未対応')
    resolution_message = Column(Text)

class Changelog(Base):
    __tablename__ = "changelog"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, nullable=False)
    release_date = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)

class MockExamResult(Base):
    __tablename__ = "mock_exam_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    result_type = Column(String, nullable=False)
    mock_exam_name = Column(String, nullable=False)
    mock_exam_format = Column(String, nullable=False)
    grade = Column(String, nullable=False)
    round = Column(String, nullable=False)
    exam_date = Column(Date)
    
    subject_kokugo_desc = Column(Integer)
    subject_math_desc = Column(Integer)
    subject_english_desc = Column(Integer)
    subject_rika1_desc = Column(Integer)
    subject_rika2_desc = Column(Integer)
    subject_shakai1_desc = Column(Integer)
    subject_shakai2_desc = Column(Integer)
    
    subject_kokugo_mark = Column(Integer)
    subject_math1a_mark = Column(Integer)
    subject_math2bc_mark = Column(Integer)
    subject_english_r_mark = Column(Integer)
    subject_english_l_mark = Column(Integer)
    subject_rika1_mark = Column(Integer)
    subject_rika2_mark = Column(Integer)
    subject_shakai1_mark = Column(Integer)
    subject_shakai2_mark = Column(Integer)
    subject_rika_kiso1_mark = Column(Integer)
    subject_rika_kiso2_mark = Column(Integer)
    subject_info_mark = Column(Integer)

    student = relationship("Student", back_populates="mock_exam_results")

class EikenResult(SQLModel, table=True):
    # add_eiken_table.py で作成したテーブル名を指定 (通常はクラス名のスネークケースですが、明示すると確実です)
    __tablename__: str = "eiken_results" 

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id")
    
    # 以下のフィールド名は add_eiken_table.py の定義と合わせてください
    exam_date: date
    grade: str      # 例: "2級", "準1級"
    score: int      # CSEスコア
    result: str     # 例: "合格", "不合格"

    # 必要であればリレーション
    # student: Optional["Student"] = Relationship(back_populates="eiken_results")
