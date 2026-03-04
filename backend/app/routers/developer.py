from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
import subprocess
import logging

from app.db.database import get_db, SessionLocal
from app.models.models import User, Student
from app.routers.deps import get_current_developer_user

# --- Logger Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- 学年自動更新のロジック (scheduler.py と同じ内容を共通化できるとベストですが、今回は直接記述します) ---
def update_grades_logic(db: Session):
    students = db.query(Student).all()
    
    grade_mapping = {
        "中1": "中2",
        "中2": "中3",
        "中3": "高1",
        "高1": "高2",
        "高2": "高3",
        "高3": "既卒"
    }
    
    updated_count = 0
    for student in students:
        if student.grade in grade_mapping:
            student.grade = grade_mapping[student.grade]
            updated_count += 1
            
    db.commit()
    return updated_count

# --- 1. 学年更新の強制実行 (Developer専用) ---
@router.post("/force-update-grades")
def force_update_grades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_developer_user)
):
    try:
        updated_count = update_grades_logic(db)
        logger.info(f"👨‍💻 Developer {current_user.username} triggered force grade update. Updated {updated_count} students.")
        return {
            "message": "学年の強制更新が完了しました。",
            "updated_count": updated_count
        }
    except Exception as e:
        logger.error(f"❌ Force grade update error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="学年の更新中にエラーが発生しました。")

# --- 2. データベースのダウンロード (Admin/UserからDeveloperへ移設) ---
@router.get("/export-db")
def export_database(
    current_user: User = Depends(get_current_developer_user)
):
    # Render等の環境でのパスに注意。ここではカレントディレクトリの test.db を想定。
    # 実際の環境に合わせてパスを変更してください。
    db_path = "test.db"
    
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="データベースファイルが見つかりません。")
        
    # 現在の日時をファイル名に付与
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{timestamp}.sqlite3" # or .db
    
    logger.info(f"👨‍💻 Developer {current_user.username} downloaded the database.")
    
    return FileResponse(
        path=db_path,
        filename=filename,
        media_type="application/octet-stream"
    )

# --- 3. システム情報の取得 (ダッシュボード表示用) ---
@router.get("/system-info")
def get_system_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_developer_user)
):
    # DBのサイズや最終バックアップ日時などを取得する想定（今回はモックデータを返します）
    db_size = os.path.getsize("test.db") if os.path.exists("test.db") else 0
    size_mb = round(db_size / (1024 * 1024), 2)
    
    return {
        "db_size_mb": size_mb,
        "last_backup": "未取得",
        "active_users": db.query(User).count(),
        "total_students": db.query(Student).count()
    }