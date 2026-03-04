from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.models.models import AuditLog, User
from app.routers.auth import get_current_user

router = APIRouter()

# ==========================================
# 1. スキーマ定義 (レスポンス用)
# ==========================================
class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    branch_id: int | None
    details: str | None
    timestamp: datetime

    class Config:
        from_attributes = True

# ==========================================
# 2. ログを記録する便利関数 (他のAPIから呼び出す用)
# ==========================================
def log_action(db: Session, user_id: int, action: str, branch_id: int = None, details: str = ""):
    """
    他のAPIエンドポイントの中で `log_action(db, user.id, "LOGIN", user.branch_id, "ログイン成功")` 
    のように呼び出して使います。
    """
    new_log = AuditLog(
        user_id=user_id,
        action=action,
        branch_id=branch_id,
        details=details,
        timestamp=datetime.utcnow()
    )
    db.add(new_log)
    db.commit()

# ==========================================
# 3. 監査ログを取得するAPI (ここで権限の分岐！)
# ==========================================
@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ① user(一般講師) はアクセス禁止
    if current_user.role not in ["admin", "developer"]:
        raise HTTPException(status_code=403, detail="アクセス権限がありません")

    query = db.query(AuditLog)

    # ② Admin(教室長) なら、自分の校舎(branch_id)のログだけに絞り込む！
    if current_user.role == "admin":
        # ※Userモデルに branch_id がある前提です
        query = query.filter(AuditLog.branch_id == current_user.branch_id)
    
    # ③ Developer(開発者) は上のif文をスルーするので、全校舎のデータが取得される
    
    # 最新のものから順に100件取得
    logs = query.order_by(AuditLog.timestamp.desc()).limit(100).all()
    
    return logs