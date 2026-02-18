from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.database import get_db
from app.routers import deps
from app.schemas import schemas
from app.models import models
from app.crud import crud_master, crud_user, crud_student
import traceback

router = APIRouter()

# Dependency to check if user is admin
def get_current_admin(current_user: models.User = Depends(deps.get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# 1. 新規登録
@router.post("/textbooks")
def create_textbook(
    data: schemas.MasterTextbookCreate, 
    session: Session = Depends(get_db)
):
    # 重複チェック
    existing = session.query(models.MasterTextbook).filter(
        models.MasterTextbook.book_name == data.book_name,
        models.MasterTextbook.subject == data.subject
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Textbook already exists")

    new_book = models.MasterTextbook(
        subject=data.subject,
        level=data.level,
        book_name=data.book_name,
        duration=data.duration
    )
    session.add(new_book)
    session.commit()
    session.refresh(new_book)
    return new_book

# 2. 更新
@router.patch("/textbooks/{book_id}")
def update_textbook(
    book_id: int,
    data: schemas.MasterTextbookUpdate,
    session: Session = Depends(get_db)
):
    book = session.query(models.MasterTextbook).filter(models.MasterTextbook.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Textbook not found")
    
    if data.subject is not None:
        book.subject = data.subject
    if data.level is not None:
        book.level = data.level
    if data.book_name is not None:
        book.book_name = data.book_name
    if data.duration is not None:
        book.duration = data.duration

    session.commit()
    session.refresh(book)
    return book

# 3. 削除
@router.delete("/textbooks/{book_id}")
def delete_textbook(book_id: int, session: Session = Depends(get_db)):
    book = session.query(models.MasterTextbook).filter(models.MasterTextbook.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Textbook not found")
    
    session.delete(book)
    session.commit()
    return {"message": "Deleted successfully"}

# --- Preset Management API ---

# 1. プリセット一覧取得
@router.get("/presets")
def get_admin_presets(session: Session = Depends(get_db)):
    presets = session.query(models.BulkPreset).options(joinedload(models.BulkPreset.books)).all()
    # シンプルな形式で返す
    return [
        {
            "id": p.id,
            "preset_name": p.preset_name,
            "subject": p.subject,
            "books": [b.book_name for b in p.books]
        }
        for p in presets
    ]

# 2. プリセット作成
@router.post("/presets")
def create_preset(
    data: schemas.BulkPresetCreate,
    session: Session = Depends(get_db)
):
    # 重複チェック
    existing = session.query(models.BulkPreset).filter(
        models.BulkPreset.subject == data.subject,
        models.BulkPreset.preset_name == data.preset_name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Preset already exists")

    # プリセット親作成
    new_preset = models.BulkPreset(
        subject=data.subject,
        preset_name=data.preset_name
    )
    session.add(new_preset)
    session.flush() # ID生成のため

    # 子（本）作成
    for book_name in data.book_names:
        new_book = models.BulkPresetBook(
            preset_id=new_preset.id,
            book_name=book_name
        )
        session.add(new_book)
    
    session.commit()
    return {"message": "Preset created successfully"}

# 3. プリセット削除
@router.delete("/presets/{preset_id}")
def delete_preset(preset_id: int, session: Session = Depends(get_db)):
    preset = session.query(models.BulkPreset).filter(models.BulkPreset.id == preset_id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    
    session.delete(preset)
    session.commit()
    return {"message": "Deleted successfully"}

@router.put("/presets/{preset_id}")
def update_preset(
    preset_id: int,
    data: schemas.BulkPresetUpdate,
    session: Session = Depends(get_db)
):
    preset = session.query(models.BulkPreset).filter(models.BulkPreset.id == preset_id).first()
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    if data.preset_name is not None:
        preset.preset_name = data.preset_name
    if data.subject is not None:
        preset.subject = data.subject
    
    if data.book_names is not None:
        # 既存の紐付けを削除して再登録
        session.query(models.BulkPresetBook).filter(models.BulkPresetBook.preset_id == preset.id).delete()
        for book_name in data.book_names:
            new_book = models.BulkPresetBook(
                preset_id=preset.id,
                book_name=book_name
            )
            session.add(new_book)
            
    session.commit()
    return {"message": "Updated successfully"}

@router.get("/users", response_model=List[schemas.User])
def read_users(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    # crud_user.get_users needed
    return db.query(models.User).offset(skip).limit(limit).all()

@router.post("/users", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    db_user = crud_user.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud_user.create_user(db, user=user)

@router.post("/students", response_model=schemas.Student)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    # Check if student already exists? Unique constraint on (school, name) handles it,
    # but we might want to check nicely.
    # crud_external has get_student_id_by_name usable here?
    # db_student = crud_external.get_student_id_by_name(db, student.school, student.name)
    # if db_student: raise HTTPException...
    # For now, let DB constraint handle it or catch IntegrityError.
    return crud_student.create_student(db, student)

# Add other admin endpoints (delete user, etc.) as needed

@router.get("/mock_exams")
def get_all_mock_exams(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user)
):
    try:
        # MockExamResult と Student を結合して取得
        # Student.user_id ではなく Student.name を使用する
        results = db.query(
            models.MockExamResult,
            models.Student.name.label("student_name")
        ).join(models.Student, models.MockExamResult.student_id == models.Student.id)\
         .order_by(models.MockExamResult.exam_date.desc()).all()
        
        final_list = []

        for record, student_name in results:
            # モデル定義（subject_xxx_xxx）に基づいた科目マップ
            # (表示名, 記述式のカラム名, マーク式のカラム名)
            subject_configs = [
                ("英語", "subject_english_desc", "subject_english_r_mark"),
                ("数学", "subject_math_desc", "subject_math1a_mark"),
                ("国語", "subject_kokugo_desc", "subject_kokugo_mark"),
                ("理科1", "subject_rika1_desc", "subject_rika1_mark"),
                ("理科2", "subject_rika2_desc", "subject_rika2_mark"),
                ("社会1", "subject_shakai1_desc", "subject_shakai1_mark"),
                ("社会2", "subject_shakai2_desc", "subject_shakai2_mark"),
                ("理科基礎1", None, "subject_rika_kiso1_mark"),
                ("理科基礎2", None, "subject_rika_kiso2_mark"),
                ("情報", None, "subject_info_mark"),
            ]

            for label, desc_col, mark_col in subject_configs:
                score_desc = getattr(record, desc_col, None) if desc_col else None
                score_mark = getattr(record, mark_col, None) if mark_col else None
                
                # いずれかに値があればデータ行を作成
                if score_desc is not None or score_mark is not None:
                    # 両方ある場合は（英語のR/L合算などの複雑化を避け）優先順位で取得
                    val = score_desc if score_desc is not None else score_mark
                    
                    final_list.append({
                        "id": f"{record.id}_{label}", 
                        "student_name": student_name,
                        "student_grade": record.grade, # MockExamResultのgradeを使用
                        "exam_name": f"{record.mock_exam_name} (第{record.round}回)",
                        "subject": label,
                        "score": val,
                        "deviation": None, # 必要に応じてモデルにdeviationカラムを追加してください
                        "exam_date": record.exam_date.strftime('%Y-%m-%d') if record.exam_date else "不明"
                    })

        return final_list

    except Exception as e:
        print("ERROR in get_all_mock_exams:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")

# ==========================================
#  講師 (User) 管理機能
# ==========================================

# 1. 講師一覧取得 (role='admin' のユーザーを取得)
@router.get("/instructors")
def read_instructors(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user)
):
    """
    管理者権限を持つユーザー（講師）の一覧を取得します。
    生徒の担当講師設定のドロップダウンなどで使用します。
    """
    admins = db.query(models.User).filter(models.User.role == 'admin').all()
    return admins

# 2. 講師情報の更新
@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    data: dict, # 柔軟な更新のためdictで受け取ります
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # パスワード更新が含まれる場合はハッシュ化が必要ですが、
    # ここでは簡易的に属性更新のみ実装します
    for key, value in data.items():
        if hasattr(user, key) and key != "id" and key != "password":
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user

# 3. 講師の削除
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 紐づくデータ(StudentInstructorなど)の削除設定はモデルのcascade設定に依存
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


# ==========================================
#  生徒 (Student) 管理機能
# ==========================================

# 1. 生徒一覧取得 (担当講師情報を含めて取得)
@router.get("/students_list")
def read_students_with_details(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user)
):
    students = db.query(models.Student).all()
    results = []
    
    for s in students:
        # StudentInstructorテーブルからメイン・サブ講師を探す
        # s.instructors は relationship で定義されている前提
        main_instructor = None
        sub_instructor = None
        
        # instructorsリレーションがロードできているか確認
        if hasattr(s, "instructors"):
            for link in s.instructors:
                if link.is_main and link.user:
                    main_instructor = {"id": link.user.id, "name": link.user.username}
                elif not link.is_main and link.user:
                    sub_instructor = {"id": link.user.id, "name": link.user.username}

        results.append({
            "id": s.id,
            "name": s.name,
            "grade": s.grade,
            "school": getattr(s, "current_school", s.school), # 新旧カラム対応
            "previous_school": s.previous_school,
            "deviation_value": s.deviation_value,
            "target_level": s.target_level,
            "main_instructor": main_instructor,
            "sub_instructor": sub_instructor,
            "main_instructor_id": main_instructor["id"] if main_instructor else None,
            "sub_instructor_id": sub_instructor["id"] if sub_instructor else None,
        })
    
    return results

# 2. 生徒情報の更新 (メイン/サブ講師の紐付け処理含む)
@router.patch("/students/{student_id}")
def update_student(
    student_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 基本情報の更新
    updatable_fields = ["name", "grade", "current_school", "previous_school", "deviation_value", "target_level"]
    for field in updatable_fields:
        if field in data:
            setattr(student, field, data[field])
            
    # "school" (校舎名) の更新リクエストが来た場合の対応（必要なら）
    if "school" in data and hasattr(student, "school"):
         setattr(student, "school", data["school"])

    # --- 講師の紐付け更新ロジック ---
    
    # メイン講師の更新
    if "main_instructor_id" in data:
        new_main_id = data["main_instructor_id"]
        # 既存のメイン講師設定を削除
        db.query(models.StudentInstructor).filter(
            models.StudentInstructor.student_id == student_id,
            models.StudentInstructor.is_main == True
        ).delete()
        
        # 新しいIDが指定されていれば追加 (0やNoneでなければ)
        if new_main_id:
            db.add(models.StudentInstructor(
                student_id=student_id,
                user_id=new_main_id,
                is_main=True
            ))

    # サブ講師の更新
    if "sub_instructor_id" in data:
        new_sub_id = data["sub_instructor_id"]
        # 既存のサブ講師設定を削除
        db.query(models.StudentInstructor).filter(
            models.StudentInstructor.student_id == student_id,
            models.StudentInstructor.is_main == False
        ).delete()
        
        # 新しいIDが指定されていれば追加
        if new_sub_id:
            db.add(models.StudentInstructor(
                student_id=student_id,
                user_id=new_sub_id,
                is_main=False
            ))

    db.commit()
    db.refresh(student)
    return {"message": "Student updated successfully"}

# 3. 生徒の削除
@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_admin_user)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Cascade設定がモデルにあれば関連データも消えますが、念のため生徒本体を削除
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}