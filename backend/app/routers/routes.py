from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.database import get_db
from app.models.models import RootTable

router = APIRouter()

# レスポンス用モデル (ファイルの中身は含めない)
class RootTableMeta(BaseModel):
    id: int
    filename: string
    subject: Optional[str]
    level: Optional[str]
    academic_year: Optional[int]
    uploaded_at: Optional[datetime]

    class Config:
        orm_mode = True

# 1. 一覧取得API
@router.get("/list", response_model=List[RootTableMeta])
def get_route_list(session: Session = Depends(get_db)):
    # file_contentカラムを除外して取得
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
    
    # ファイル名が日本語の場合などを考慮し、URLエンコードするか、単純なASCII名にするか等の配慮が必要な場合がありますが
    # ここではそのまま返します。
    # media_typeはPDF固定としていますが、必要なら拡張子で判断します。
    return Response(
        content=file_record.file_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{file_record.filename}"'
        }
    )
