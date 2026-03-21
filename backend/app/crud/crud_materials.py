from sqlalchemy.orm import Session
from app.models import models
from app.schemas import schemas

# --- タグ操作 ---
def get_or_create_subject_tag(db: Session, name: str):
    tag = db.query(models.SubjectTag).filter(models.SubjectTag.name == name).first()
    if not tag:
        tag = models.SubjectTag(name=name)
        db.add(tag)
        db.commit()
        db.refresh(tag)
    return tag

def get_or_create_detail_tag(db: Session, name: str):
    tag = db.query(models.DetailTag).filter(models.DetailTag.name == name).first()
    if not tag:
        tag = models.DetailTag(name=name)
        db.add(tag)
        db.commit()
        db.refresh(tag)
    return tag

def get_all_subject_tags(db: Session):
    return db.query(models.SubjectTag).all()

def get_all_detail_tags(db: Session):
    return db.query(models.DetailTag).all()

# --- 教材操作 ---
def create_material(db: Session, title: str, file_path: str, internal_memo: str = None, subject_id: int = None, detail_tag_id: int = None):
    db_material = models.TeachingMaterial(
        title=title,
        file_path=file_path,
        internal_memo=internal_memo,
        subject_id=subject_id,
        detail_tag_id=detail_tag_id
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

def get_materials(db: Session, subject_id: int = None, detail_tag_id: int = None, search_query: str = None):
    query = db.query(models.TeachingMaterial)
    
    if subject_id:
        query = query.filter(models.TeachingMaterial.subject_id == subject_id)
    if detail_tag_id:
        query = query.filter(models.TeachingMaterial.detail_tag_id == detail_tag_id)
    if search_query:
        query = query.filter(models.TeachingMaterial.title.ilike(f"%{search_query}%"))
        
    # 新しい順に並び替え
    return query.order_by(models.TeachingMaterial.created_at.desc()).all()

def get_material(db: Session, material_id: int):
    return db.query(models.TeachingMaterial).filter(models.TeachingMaterial.id == material_id).first()

def delete_material(db: Session, material_id: int):
    db_material = get_material(db, material_id)
    if db_material:
        db.delete(db_material)
        db.commit()
    return db_material