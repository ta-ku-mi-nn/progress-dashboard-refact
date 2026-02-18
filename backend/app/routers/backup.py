# backend/app/routers/backup.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import text, inspect
from datetime import datetime, date
import json
import os
import decimal
import uuid

from app.routers import deps
from app.db.database import get_db
from sqlalchemy.orm import Session
from app.models.models import User

router = APIRouter()

# --- カスタムJSONエンコーダー ---
# 日付やUUIDなど、JSONにそのまま書けない型を文字列に変換する関数
def custom_json_serializer(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, (decimal.Decimal, uuid.UUID)):
        return str(obj)
    # bytes型は文字列にデコードできない場合があるため、安全に文字列表現にする
    if isinstance(obj, bytes):
        return f"<bytes: {len(obj)}>"
    # その他の未知の型は、強制的に文字列化する (str()関数を通す)
    return str(obj)

@router.get("/export")
def export_database(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    try:
        # 1. データベース接続からインスペクターを取得
        bind = db.get_bind()
        inspector = inspect(bind)
        table_names = inspector.get_table_names()
        
        backup_data = {}
        print(f"DEBUG: Starting safe backup for tables: {table_names}")
        
        # 2. 各テーブルのデータを取得
        for table in table_names:
            try:
                # 生SQLで全件取得
                query = text(f"SELECT * FROM {table}")
                result = db.execute(query)
                
                # カラム名を取得
                keys = result.keys()
                
                # 行データを辞書リストに変換
                # zipを使う最も原始的で確実な方法を採用
                rows = []
                for row in result.fetchall():
                    row_dict = dict(zip(keys, row))
                    rows.append(row_dict)
                
                backup_data[table] = rows
                print(f"DEBUG: Table '{table}' backed up ({len(rows)} rows)")
                
            except Exception as table_error:
                print(f"ERROR: Failed to backup table '{table}': {str(table_error)}")
                backup_data[table] = {"error": str(table_error)}
            
        # 3. JSONファイルとして保存
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_full_{timestamp}.json"
        filepath = os.path.join("/tmp", filename)
        
        print("DEBUG: Serializing data to JSON...")
        
        # ★ここが修正点: jsonable_encoderを使わず、標準のjson.dumpにカスタム関数を渡す
        # これにより、どんな特殊な型が来ても custom_json_serializer が文字列に変えてくれる
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(
                backup_data, 
                f, 
                default=custom_json_serializer, # 未知の型はここで変換
                ensure_ascii=False, 
                indent=2
            )

        print(f"DEBUG: Backup saved to {filepath}")

        # 4. ダウンロード返却
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
        # 致命的なエラーは 500 で返す
        raise HTTPException(status_code=500, detail=f"Backup process failed: {str(e)}")