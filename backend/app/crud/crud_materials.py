from sqlalchemy.orm import Session
from app.models import models
from typing import List

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

# ★追加: タグの削除機能
def delete_subject_tag(db: Session, tag_id: int):
    tag = db.query(models.SubjectTag).filter(models.SubjectTag.id == tag_id).first()
    if tag:
        db.delete(tag)
        db.commit()
    return tag

def delete_detail_tag(db: Session, tag_id: int):
    tag = db.query(models.DetailTag).filter(models.DetailTag.id == tag_id).first()
    if tag:
        db.delete(tag)
        db.commit()
    return tag


# --- 教材操作 ---
def _set_material_tags(db: Session, db_material: models.TeachingMaterial, subject_ids: List[int], detail_tag_ids: List[int]):
    """教材にタグを紐付ける共通処理"""
    if subject_ids is not None:
        db_material.subjects = db.query(models.SubjectTag).filter(models.SubjectTag.id.in_(subject_ids)).all()
    if detail_tag_ids is not None:
        db_material.detail_tags = db.query(models.DetailTag).filter(models.DetailTag.id.in_(detail_tag_ids)).all()

def create_material(db: Session, title: str, file_path: str, internal_memo: str = None, subject_ids: List[int] = [], detail_tag_ids: List[int] = []):
    db_material = models.TeachingMaterial(
        title=title,
        file_path=file_path,
        internal_memo=internal_memo,
    )
    _set_material_tags(db, db_material, subject_ids, detail_tag_ids)
    
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

# ★追加: 教材の更新機能
def update_material(db: Session, material_id: int, title: str, file_path: str = None, internal_memo: str = None, subject_ids: List[int] = None, detail_tag_ids: List[int] = None):
    db_material = db.query(models.TeachingMaterial).filter(models.TeachingMaterial.id == material_id).first()
    if not db_material:
        return None
        
    db_material.title = title
    db_material.internal_memo = internal_memo
    if file_path:  # 新しいファイルがアップロードされた場合のみパスを更新
        db_material.file_path = file_path
        
    _set_material_tags(db, db_material, subject_ids, detail_tag_ids)
    
    db.commit()
    db.refresh(db_material)
    return db_material

def get_materials(db: Session, subject_id: int = None, detail_tag_id: int = None, search_query: str = None):
    query = db.query(models.TeachingMaterial)
    
    # 中間テーブルを通した絞り込み
    if subject_id:
        query = query.filter(models.TeachingMaterial.subjects.any(id=subject_id))
    if detail_tag_id:
        query = query.filter(models.TeachingMaterial.detail_tags.any(id=detail_tag_id))
    if search_query:
        query = query.filter(models.TeachingMaterial.title.ilike(f"%{search_query}%"))
        
    return query.order_by(models.TeachingMaterial.created_at.desc()).all()

def get_material(db: Session, material_id: int):
    return db.query(models.TeachingMaterial).filter(models.TeachingMaterial.id == material_id).first()

def delete_material(db: Session, material_id: int):
    db_material = get_material(db, material_id)
    if db_material:
        db.delete(db_material)
        db.commit()
    return db_material