from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import csv
import io
import logging

from app.db.database import get_db
from app.models.models import MasterTextbook, Student, User, AuditLog
# ※ get_current_user があればインポートして、誰がインポートしたかログに残せます

router = APIRouter()
logger = logging.getLogger(__name__)

# ==========================================
# 1. 各データごとの「正しいフォーマット（ヘッダー）」を定義
# ==========================================
EXPECTED_HEADERS = {
    "textbook": ["subject", "level", "book_name", "duration"],
    "student": ["name", "grade", "branch_id", "deviation_value"],
    "user": ["username", "name", "role", "branch_id"]
}

@router.post("/upload")
async def import_csv(
    import_type: str = Form(...), # "textbook", "student", "user" のいずれか
    file: UploadFile = File(...),
    session: Session = Depends(get_db)
):
    # ① インポート対象の指定が正しいかチェック
    if import_type not in EXPECTED_HEADERS:
        raise HTTPException(status_code=400, detail=f"無効なデータ種別です: {import_type}")
        
    expected_cols = EXPECTED_HEADERS[import_type]
    
    # ② ファイルの読み込みと文字コードの自動判定（ExcelのShift-JIS対策）
    contents = await file.read()
    try:
        decoded = contents.decode('utf-8-sig') # UTF-8 (BOM付き含む)
    except UnicodeDecodeError:
        try:
            decoded = contents.decode('cp932') # Windows Excelの標準 (Shift-JIS)
        except Exception:
            raise HTTPException(status_code=400, detail="ファイルの文字コードが読み取れません。UTF-8で保存してください。")
            
    # CSVとしてパース
    reader = csv.DictReader(io.StringIO(decoded))
    actual_cols = reader.fieldnames
    
    if not actual_cols:
        raise HTTPException(status_code=400, detail="CSVファイルが空です。")
        
    # ③ データ形式（ヘッダー）の合致チェック
    missing_cols = [col for col in expected_cols if col not in actual_cols]
    if missing_cols:
        error_msg = (
            f"データ形式が正しくありません。\n"
            f"不足している列: {', '.join(missing_cols)}\n"
            f"正しい形式（1行目）: {', '.join(expected_cols)}"
        )
        raise HTTPException(status_code=400, detail=error_msg)
        
    success_count = 0
    update_count = 0
    
    # ④ データの保存処理（上書き or 新規追加）
    try:
        for row in reader:
            # ▼ 参考書マスタの場合
            if import_type == "textbook":
                # 科目と参考書名で既存データを検索
                existing = session.query(MasterTextbook).filter(
                    MasterTextbook.subject == row["subject"],
                    MasterTextbook.book_name == row["book_name"]
                ).first()
                
                if existing:
                    # あれば上書き (UPDATE)
                    existing.level = row["level"]
                    existing.duration = float(row["duration"]) if row["duration"] else 0.0
                    update_count += 1
                else:
                    # なければ新規作成 (INSERT)
                    new_book = MasterTextbook(
                        subject=row["subject"],
                        level=row["level"],
                        book_name=row["book_name"],
                        duration=float(row["duration"]) if row["duration"] else 0.0
                    )
                    session.add(new_book)
                    success_count += 1
                    
            # ▼ 生徒データの場合
            elif import_type == "student":
                # 名前と校舎で既存データを検索（同姓同名対策）
                existing = session.query(Student).filter(
                    Student.name == row["name"],
                    Student.branch_id == (int(row["branch_id"]) if row["branch_id"] else None)
                ).first()
                
                if existing:
                    existing.grade = row["grade"]
                    existing.deviation_value = float(row["deviation_value"]) if row["deviation_value"] else None
                    update_count += 1
                else:
                    new_student = Student(
                        name=row["name"],
                        grade=row["grade"],
                        branch_id=int(row["branch_id"]) if row["branch_id"] else None,
                        deviation_value=float(row["deviation_value"]) if row["deviation_value"] else None
                    )
                    session.add(new_student)
                    success_count += 1
                    
            # ▼ 講師データ(User)の場合も同様に追加可能...
            elif import_type == "user":
                pass # ここにUserの上書き/追加処理を書く

        # まとめてDBに保存
        session.commit()
        
        # ⑤ おまけ：誰がインポートしたか監査ログに残すと完璧です
        # audit_log = AuditLog(action="CSV_IMPORT", details=f"{import_type}をインポート: 新規{success_count}件, 更新{update_count}件")
        # session.add(audit_log)
        # session.commit()
        
        return {
            "status": "success", 
            "message": f"CSVのインポートが完了しました！\n新規追加: {success_count}件\nデータ更新: {update_count}件"
        }
        
    except Exception as e:
        session.rollback()
        logger.error(f"CSV Import Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"データの保存中にエラーが発生しました。CSVの中身（数字や空白）を確認してください。エラー詳細: {str(e)}")