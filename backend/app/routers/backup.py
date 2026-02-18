# backend/app/routers/backup.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from datetime import datetime
import os
from app.routers import deps
from app.models.models import User

router = APIRouter()

@router.get("/export")
def export_database(
    current_user: User = Depends(deps.get_current_user)
):
    # DBファイルのパス候補 (環境に合わせて調整)
    db_paths = ["./sql_app.db", "./backend/sql_app.db", "/var/data/sql_app.db"]
    target_path = None

    for path in db_paths:
        if os.path.exists(path):
            target_path = path
            break
    
    if not target_path:
        raise HTTPException(status_code=404, detail="Database file not found")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{timestamp}.db"

    return FileResponse(
        path=target_path,
        filename=filename,
        media_type='application/x-sqlite3',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )