# backend/app/routers/backup.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy import text, inspect
from datetime import datetime
import json
import os

from app.routers import deps
from app.db.database import get_db
from sqlalchemy.orm import Session
from app.models.models import User

router = APIRouter()

@router.get("/export")
def export_database(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    try:
        # 1. テーブル一覧を取得
        bind = db.get_bind()
        inspector = inspect(bind)
        table_names = inspector.get_table_names()
        
        backup_data = {}
        print(f"DEBUG: Starting backup for tables: {table_names}")
        
        # 2. 各テーブルのデータを取得
        for table in table_names:
            try:
                # 生SQLで全件取得
                query = text(f"SELECT * FROM {table}")
                result = db.execute(query)
                
                # ★修正ポイント: result.mappings() を使用して安全に辞書化
                # これにより "ValueError" や "zip" の問題を回避
                rows = [dict(row) for row in result.mappings().all()]
                
                backup_data[table] = rows
                print(f"DEBUG: Table '{table}' backed up ({len(rows)} rows)")
                
            except Exception as table_error:
                print(f"ERROR: Failed to backup table '{table}': {str(table_error)}")
                # 特定テーブルのエラーはログに出してスキップし、他のテーブルのバックアップを続ける
                backup_data[table] = {"error": str(table_error)}
            
        # 3. JSONファイルとして保存
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_full_{timestamp}.json"
        filepath = os.path.join("/tmp", filename)
        
        # 4. JSON化 (日付型などを文字列に変換)
        try:
            # jsonable_encoder で datetime 型などを JSON 標準型に変換
            json_compatible_data = jsonable_encoder(backup_data)
        except Exception as encode_error:
            print(f"ERROR: JSON encoding failed: {encode_error}")
            # エンコード失敗時は、最低限のエラー情報を返す
            json_compatible_data = {"error": "JSON encoding failed", "details": str(encode_error)}

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(json_compatible_data, f, ensure_ascii=False, indent=2)

        print(f"DEBUG: Backup saved to {filepath}")

        # 5. ダウンロード返却
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='application/json',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Backup Global Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Backup process failed: {str(e)}")