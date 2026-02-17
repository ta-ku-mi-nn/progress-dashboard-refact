from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from urllib.parse import quote  # ★追加: URLエンコード用
from app.db.database import get_db
from app.models.models import RootTable

router = APIRouter()

# レスポンス用モデル
class RootTableMeta(BaseModel):
    id: int
    filename: str
    subject: Optional[str]
    level: Optional[str]
    academic_year: Optional[int]
    uploaded_at: Optional[datetime]

    class Config:
        orm_mode = True

# 1. 一覧取得API
@router.get("/list", response_model=List[RootTableMeta])
def get_route_list(session: Session = Depends(get_db)):
    return session.query(
        RootTable.id,
        RootTable.filename,
        RootTable.subject,
        RootTable.level,
        RootTable.academic_year,
        RootTable.uploaded_at
    ).order_by(RootTable.uploaded_at.desc()).all()

# 2. ダウンロードAPI
@router.get("/download/{file_id}")
def download_route_file(file_id: int, session: Session = Depends(get_db)):
    file_record = session.query(RootTable).filter(RootTable.id == file_id).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # ★修正: 日本語ファイル名対応
    # ファイル名をURLエンコードする
    encoded_filename = quote(file_record.filename)
    
    return Response(
        content=file_record.file_content,
        media_type="application/pdf",
        headers={
            # RFC 5987形式で指定することで、日本語ファイル名が文字化けせずにダウンロードされます
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        }
    )

# ★追加: 3. アップロードAPI
@router.post("/upload")
async def upload_route_table(
    file: UploadFile = File(...),
    subject: str = Form(...),
    level: str = Form(...),
    academic_year: int = Form(...),
    session: Session = Depends(get_db)
):
    try:
        content = await file.read()
        new_table = RootTable(
            filename=file.filename,
            file_content=content,
            subject=subject,
            level=level,
            academic_year=academic_year
        )
        session.add(new_table)
        session.commit()
        return {"message": "Uploaded successfully", "filename": file.filename}
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

# ★追加: 4. 削除API
@router.delete("/{file_id}")
def delete_route_table(file_id: int, session: Session = Depends(get_db)):
    item = session.query(RootTable).filter(RootTable.id == file_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    
    session.delete(item)
    session.commit()
    return {"message": "Deleted successfully"}
