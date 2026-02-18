# backend/app/routers/backup.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy import text, inspect
from datetime import datetime
import json
import os

from app.routers import deps
from app.db.database import get_db, engine
from sqlalchemy.orm import Session
from app.models.models import User

router = APIRouter()

@router.get("/export")
def export_database(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Pythonのみを使用して全テーブルのデータをJSON形式でバックアップします。
    (pg_dumpなどの外部コマンド不要)
    """
    try:
        # 1. データベース内の全テーブル名を取得
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        
        backup_data = {}
        
        # 2. 各テーブルのデータを取得
        for table in table_names:
            # 生SQLで全件取得
            query = text(f"SELECT * FROM {table}")
            result = db.execute(query)
            
            # カラム名を取得
            keys = result.keys()
            
            # 辞書リストに変換
            rows = [dict(zip(keys, row)) for row in result.fetchall()]
            
            backup_data[table] = rows
            
        # 3. JSONファイルとして保存 (日付などの型変換はjsonable_encoderにお任せ)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_full_{timestamp}.json"
        filepath = f"/tmp/{filename}"
        
        # FastAPIのエンコーダーを通してJSON化（日付型などを文字列に変換）
        json_compatible_data = jsonable_encoder(backup_data)
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(json_compatible_data, f, ensure_ascii=False, indent=2)

        # 4. ダウンロード返却
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='application/json',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        print(f"Backup Error: {str(e)}")
        # エラー内容をコンソールに出しつつ、500エラーを返す
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")