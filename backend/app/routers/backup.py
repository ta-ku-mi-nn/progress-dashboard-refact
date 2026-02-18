# backend/app/routers/backup.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from datetime import datetime
import os
import glob
from app.routers import deps
from app.models.models import User

router = APIRouter()

@router.get("/export")
def export_database(
    current_user: User = Depends(deps.get_current_user)
):
    # 現在のディレクトリを確認
    current_dir = os.getcwd()
    print(f"DEBUG: Current Working Directory: {current_dir}")
    print(f"DEBUG: Files in Current Directory: {os.listdir(current_dir)}")

    # 探索するパスの候補（Renderの構造を考慮）
    # Start Commandが 'cd backend' している場合、カレントは backend フォルダ内
    candidate_paths = [
        "sql_app.db",                     # カレントディレクトリ
        "../sql_app.db",                  # 1つ上
        "./app/sql_app.db",               # appフォルダ内
        "/opt/render/project/src/backend/sql_app.db", # Renderの絶対パス(予想)
        "/opt/render/project/src/sql_app.db"          # ルートの絶対パス
    ]
    
    target_path = None

    # 1. 候補リストから探す
    for path in candidate_paths:
        if os.path.exists(path):
            target_path = path
            print(f"DEBUG: Found DB at candidate path: {path}")
            break
    
    # 2. まだ見つからなければ、再帰的に探す（最終手段）
    if not target_path:
        print("DEBUG: Searching recursively...")
        # カレントディレクトリ以下を検索
        found_files = glob.glob("**/sql_app.db", recursive=True)
        # 見つからなければ一つ上の階層も検索
        if not found_files:
             found_files = glob.glob("../**/sql_app.db", recursive=True)
             
        if found_files:
            target_path = found_files[0]
            print(f"DEBUG: Found DB via glob: {target_path}")

    if not target_path:
        print("ERROR: Database file NOT FOUND anywhere.")
        raise HTTPException(status_code=404, detail="Database file not found on server")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{timestamp}.db"

    return FileResponse(
        path=target_path,
        filename=filename,
        media_type='application/x-sqlite3',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )