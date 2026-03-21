import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.crud import crud_materials
from app.schemas import schemas
from app.routers import deps # 認証が必要な場合は deps.get_current_user 等を使用

router = APIRouter()

# 保存先ディレクトリの設定
UPLOAD_DIR = "uploaded_materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- タグ関連エンドポイント ---
@router.get("/tags/subjects", response_model=List[schemas.SubjectTagResponse])
def read_subject_tags(db: Session = Depends(get_db)):
    return crud_materials.get_all_subject_tags(db)

@router.get("/tags/details", response_model=List[schemas.DetailTagResponse])
def read_detail_tags(db: Session = Depends(get_db)):
    return crud_materials.get_all_detail_tags(db)

@router.post("/tags/subjects", response_model=schemas.SubjectTagResponse)
def create_subject_tag(tag: schemas.TagCreate, db: Session = Depends(get_db)):
    return crud_materials.get_or_create_subject_tag(db, tag.name)

@router.post("/tags/details", response_model=schemas.DetailTagResponse)
def create_detail_tag(tag: schemas.TagCreate, db: Session = Depends(get_db)):
    return crud_materials.get_or_create_detail_tag(db, tag.name)

# --- 教材関連エンドポイント ---
@router.post("/", response_model=schemas.TeachingMaterialResponse)
def upload_material(
    title: str = Form(...),
    internal_memo: Optional[str] = Form(None),
    subject_id: Optional[int] = Form(None),
    detail_tag_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # current_user = Depends(deps.get_current_active_user) # 必要に応じて認証を追加
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="PDFファイルのみアップロード可能です")

    # ファイルの保存（ファイル名の重複を避けるためにタイムスタンプ等を付与しても良いです）
    safe_filename = file.filename.replace(" ", "_")
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return crud_materials.create_material(
        db=db,
        title=title,
        file_path=file_path,
        internal_memo=internal_memo,
        subject_id=subject_id,
        detail_tag_id=detail_tag_id
    )

@router.get("/", response_model=List[schemas.TeachingMaterialResponse])
def read_materials(
    subject_id: Optional[int] = None,
    detail_tag_id: Optional[int] = None,
    search_query: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud_materials.get_materials(db, subject_id, detail_tag_id, search_query)

@router.get("/{material_id}/pdf")
def download_material_pdf(material_id: int, db: Session = Depends(get_db)):
    material = crud_materials.get_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if not os.path.exists(material.file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on server")
    
    # プレビューできるようにメディアタイプを指定して返す
    return FileResponse(material.file_path, media_type="application/pdf", filename=os.path.basename(material.file_path))

@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    material = crud_materials.delete_material(db, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # DBから消したら、実際のPDFファイルも削除する
    if os.path.exists(material.file_path):
        os.remove(material.file_path)
        
    return {"detail": "Material deleted successfully"}