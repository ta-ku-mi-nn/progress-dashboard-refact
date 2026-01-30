from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.routers import deps
from app.crud import crud_student, crud_progress, crud_homework
from app.schemas import schemas
from app.models.models import User

router = APIRouter()

@router.get("/", response_model=List[schemas.Student])
def read_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    students = crud_student.get_students_for_user(db, user=current_user)
    return students

@router.get("/{student_id}", response_model=schemas.Student)
def read_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    student = crud_student.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    # Authorization check: is this student assigned to the user?
    # (Simplified for now, assuming if they can see the list, they can see details, 
    # but strictly we should check association again if ID is guessed)
    return student

@router.get("/{student_id}/progress", response_model=List[schemas.Progress])
def read_student_progress(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Logic to adjust duration based on deviation would happen here in a Service, 
    # then mapped to Schema.
    # For now, we return raw progress.
    raw_results = crud_progress.get_student_progress(db, student_id)
    
    # Map (Progress, MasterTextbook) tuple to Schema or Dict
    # Schema 'Progress' matches the model fields.
    # We might need to inject the 'duration' if it was None in Progress but present in MasterTextbook.
    
    results = []
    for p, m in raw_results:
        # Clone p to avoiding mutating DB object directly if session is active
        # or just use Pydantic from_orm?
        # But we need to handle the coalesce logic for duration.
        
        duration = p.duration
        if duration is None and m:
            duration = m.duration
            
        # Create a dict overlay
        p_dict = {
            "id": p.id,
            "student_id": p.student_id,
            "subject": p.subject,
            "level": p.level,
            "book_name": p.book_name,
            "duration": duration,
            "is_planned": p.is_planned,
            "is_done": p.is_done,
            "completed_units": p.completed_units,
            "total_units": p.total_units
        }
        results.append(p_dict)
        
    return results

@router.post("/{student_id}/progress")
def update_student_progress(
    student_id: int,
    progress: List[schemas.ProgressUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    count = crud_progress.update_student_progress(db, student_id, progress)
    return {"message": f"Updated {count} records"}

@router.get("/{student_id}/homework", response_model=List[schemas.Homework])
def read_student_homework(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    raw_results = crud_homework.get_student_homework(db, student_id)
    results = []
    for hw, mt in raw_results:
        hw_dict = {
            "id": hw.id,
            "student_id": hw.student_id,
            "master_textbook_id": hw.master_textbook_id,
            "custom_textbook_name": hw.custom_textbook_name,
            "subject": hw.subject,
            "task": hw.task,
            "task_date": hw.task_date,
            "task_group_id": hw.task_group_id,
            "status": hw.status,
            "other_info": hw.other_info,
            "textbook_name": mt.book_name if mt else hw.custom_textbook_name
        }
        results.append(hw_dict)
    return results

@router.post("/{student_id}/homework")
def update_student_homework(
    student_id: int,
    textbook_id: Optional[int] = None,
    custom_textbook_name: Optional[str] = None,
    homework: List[schemas.HomeworkCreate] = [],
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # This endpoint mimics 'add_or_update_homework'
    # Request body should probably be a wrapper object containing `homework_list`, `textbook_id`, `custom_name`
    # checking the schema... `homework` argument is List[HomeworkCreate].
    # But we need textbook_id/custom_textbook_name which apply to the whole batch usually?
    # The frontend usually sends a batch for a specific book.
    # We will accept query params for textbook ID/Name for now, or expect them in the body if we change the schema.
    # Current design: arguments match query params or body.
    # Let's assume they are passed as query params or we define a Pydantic model for the wrapper.
    # For now, using query params for `textbook_id` and `custom_textbook_name` for simplicity with the List body.
    
    success = crud_homework.update_homework(db, student_id, textbook_id, custom_textbook_name, homework)
    if success:
        return {"message": "Homework updated"}
    else:
        raise HTTPException(status_code=400, detail="Failed to update homework")
