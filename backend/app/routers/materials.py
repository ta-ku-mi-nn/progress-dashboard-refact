import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.crud import crud_materials
from app.schemas import schemas

router = APIRouter()
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

# ★追加: タグの削除エンドポイント
@router.delete("/tags/subjects/{tag_id}")
def delete_subject_tag(tag_id: int, db: Session = Depends(get_db)):
    crud_materials.delete_subject_tag(db, tag_id)
    return {"detail": "Tag deleted"}

@router.delete("/tags/details/{tag_id}")
def delete_detail_tag(tag_id: int, db: Session = Depends(get_db)):
    crud_materials.delete_detail_tag(db, tag_id)
    return {"detail": "Tag deleted"}


# --- 教材関連エンドポイント ---
@router.post("/", response_model=schemas.TeachingMaterialResponse)
def upload_material(
    title: str = Form(...),
    internal_memo: Optional[str] = Form(""),
    subject_ids: List[int] = Form([]), # 複数受け取る
    detail_tag_ids: List[int] = Form([]), # 複数受け取る
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="PDFファイルのみアップロード可能です")

    safe_filename = file.filename.replace(" ", "_")
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return crud_materials.create_material(db, title, file_path, internal_memo, subject_ids, detail_tag_ids)

# ★追加: 教材の編集エンドポイント
@router.put("/{material_id}", response_model=schemas.TeachingMaterialResponse)
def update_material(
    material_id: int,
    title: str = Form(...),
    internal_memo: Optional[str] = Form(""),
    subject_ids: List[int] = Form([]),
    detail_tag_ids: List[int] = Form([]),
    file: Optional[UploadFile] = File(None), # ファイルは任意（差し替える時だけ送信）
    db: Session = Depends(get_db),
):
    existing_material = crud_materials.get_material(db, material_id)
    if not existing_material:
        raise HTTPException(status_code=404, detail="Material not found")

    file_path = None
    if file and file.filename:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="PDFファイルのみアップロード可能です")
        
        # 古いファイルを削除
        if os.path.exists(existing_material.file_path):
            os.remove(existing_material.file_path)
            
        safe_filename = file.filename.replace(" ", "_")
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    updated_material = crud_materials.update_material(
        db, material_id, title, file_path, internal_memo, subject_ids, detail_tag_ids
    )
    return updated_material


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
    if not material or not os.path.exists(material.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(material.file_path, media_type="application/pdf", filename=os.path.basename(material.file_path))

@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    material = crud_materials.delete_material(db, material_id)
    if material and os.path.exists(material.file_path):
        os.remove(material.file_path)
    return {"detail": "Material deleted"}