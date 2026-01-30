from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db

router = APIRouter()

@router.get("/fix-constraint")
def fix_constraint(db: Session = Depends(get_db)):
    try:
        # Check if constraint exists (postgres specific)
        check_sql = text("SELECT conname FROM pg_constraint WHERE conname = '_student_prog_uc'")
        result = db.execute(check_sql).fetchone()
        
        if result:
            return {"message": "Constraint '_student_prog_uc' already exists."}
        
        # Add constraint
        # Note: This might fail if there are duplicate rows already.
        # We can try to delete duplicates first or just let it fail.
        # For 'progress', duplicates on (student_id, subject, level, book_name) are what we want to prevent/merge.
        # Let's try to add it.
        alter_sql = text("ALTER TABLE progress ADD CONSTRAINT _student_prog_uc UNIQUE (student_id, subject, level, book_name)")
        db.execute(alter_sql)
        db.commit()
        return {"message": "Successfully added constraint '_student_prog_uc'."}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
