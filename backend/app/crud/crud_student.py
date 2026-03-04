from sqlalchemy.orm import Session, joinedload
from app.models.models import Student, StudentInstructor, User
from app.schemas.schemas import StudentCreate, StudentUpdate
from typing import List

def get_students_for_user(db: Session, user: User) -> List[Student]:
    if user.role == 'developer':
        # Developer は全校舎の全生徒を取得
        return db.query(Student).all()
    elif user.role == 'admin':
        # Admin は自分の所属する校舎の生徒のみを取得
        return db.query(Student).filter(Student.school == user.school).all()
    else:
        # 一般 User は自分に割り当てられた生徒のみを取得
        return db.query(Student).join(StudentInstructor).filter(StudentInstructor.user_id == user.id).all()

def get_student(db: Session, student_id: int):
    return db.query(Student).filter(Student.id == student_id).first()

def get_student_with_details(db: Session, student_id: int):
    # Fetch student with instructors
    # For now, just return the student, and we can fetch instructors separately or via relationship
    return db.query(Student).options(joinedload(Student.instructors)).filter(Student.id == student_id).first()

def create_student(db: Session, student: StudentCreate):
    db_student = Student(
        name=student.name,
        school=student.school,
        deviation_value=student.deviation_value,
        target_level=student.target_level,
        grade=student.grade,
        previous_school=student.previous_school
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

