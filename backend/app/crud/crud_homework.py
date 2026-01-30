from sqlalchemy.orm import Session
from app.models.models import Homework, MasterTextbook
from app.schemas.schemas import HomeworkCreate
import uuid

def get_student_homework(db: Session, student_id: int):
    # Fetch homework with master textbook details
    return db.query(Homework, MasterTextbook).outerjoin(
        MasterTextbook, Homework.master_textbook_id == MasterTextbook.id
    ).filter(Homework.student_id == student_id).order_by(Homework.task_date).all()

def update_homework(db: Session, student_id: int, textbook_id: int, custom_textbook_name: str, homework_list: list[HomeworkCreate]):
    # Logic: Delete existing homework for this student+textbook, then insert new.
    
    query = db.query(Homework).filter(Homework.student_id == student_id)
    
    if textbook_id is not None and textbook_id != -1:
        query = query.filter(Homework.master_textbook_id == textbook_id)
    elif custom_textbook_name:
         query = query.filter(Homework.custom_textbook_name == custom_textbook_name)
    else:
        # Invalid request handled by caller or simple return
        return False
        
    query.delete(synchronize_session=False)
    
    new_homeworks = []
    task_group_id = str(uuid.uuid4())
    
    for hw in homework_list:
        db_hw = Homework(
            student_id=student_id,
            master_textbook_id=textbook_id if textbook_id != -1 else None,
            custom_textbook_name=custom_textbook_name if custom_textbook_name else None,
            subject=hw.subject,
            task=hw.task,
            task_date=hw.task_date,
            task_group_id=task_group_id,
            status=hw.status,
            other_info=hw.other_info
        )
        new_homeworks.append(db_hw)
        
    db.add_all(new_homeworks)
    db.commit()
    return True
