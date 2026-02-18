# backend/app/routers/backup.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from datetime import datetime
import os
import subprocess
from urllib.parse import urlparse

from app.routers import deps
from app.models.models import User
# 設定からDB接続URLを取得
from app.core.config import settings 

router = APIRouter()

@router.get("/export")
def export_database(
    current_user: User = Depends(deps.get_current_user)
):
    """
    PostgreSQLデータベースのダンプファイルを作成してダウンロードします。
    """
    # 1. データベース接続URLを取得
    # settings.SQLALCHEMY_DATABASE_URL または 環境変数 DATABASE_URL を使用
    db_url = settings.SQLALCHEMY_DATABASE_URL
    if not db_url:
        db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        raise HTTPException(status_code=500, detail="Database URL configuration not found")

    # 2. URLを解析して接続情報を抽出
    # format: postgresql://user:password@host:port/dbname
    try:
        # "postgresql+psycopg2://" のようなドライバ指定を除去してパース
        if db_url.startswith("postgresql+"):
            db_url = db_url.replace("postgresql+psycopg2://", "postgres://")
            
        parsed = urlparse(db_url)
        hostname = parsed.hostname
        port = parsed.port or "5432"
        username = parsed.username
        password = parsed.password
        dbname = parsed.path.lstrip('/')
    except Exception as e:
        print(f"Error parsing DB URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse database configuration")

    # 3. ダンプファイルの保存先
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{dbname}_{timestamp}.sql"
    filepath = f"/tmp/{filename}" # 一時ディレクトリに保存

    # 4. pg_dumpコマンドの実行
    # PGPASSWORD環境変数をセットしてパスワード入力を回避
    env = os.environ.copy()
    if password:
        env["PGPASSWORD"] = password

    command = [
        "pg_dump",
        "-h", hostname,
        "-p", str(port),
        "-U", username,
        "-F", "p", # プレーンテキスト形式 (SQL)
        "-f", filepath,
        dbname
    ]

    print(f"DEBUG: Executing pg_dump for {dbname} on {hostname}")
    
    try:
        result = subprocess.run(
            command,
            env=env,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"pg_dump failed: {result.stderr}")
            raise Exception(f"pg_dump failed with code {result.returncode}")
            
    except FileNotFoundError:
        # ローカル開発環境などで pg_dump がインストールされていない場合
        print("pg_dump command not found. Is postgresql-client installed?")
        raise HTTPException(status_code=500, detail="Backup tool (pg_dump) not installed on server")
    except Exception as e:
        print(f"Backup error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Backup process failed: {str(e)}")

    # 5. ファイルをレスポンスとして返す
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type='application/sql',
        headers={"Content-Disposition": f"attachment; filename={filename}"},
        # ダウンロード後にファイルを削除するタスクを追加するのがベストだが、
        # Renderの一時ファイルは再起動で消えるため今回は簡易実装
    )