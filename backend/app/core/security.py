# backend/app/core/security.py

from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from werkzeug.security import generate_password_hash, check_password_hash
import os

# JWTトークン用の設定（環境変数があればそれを使用、なければデフォルト値）
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7日間有効

def get_password_hash(password: str) -> str:
    """パスワードをハッシュ化する"""
    return generate_password_hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """入力されたパスワードと、DBのハッシュ済みパスワードを比較する"""
    if not hashed_password:
        return False

    try:
        # 通常のハッシュチェック
        return check_password_hash(hashed_password, plain_password)
    except ValueError:
        # ValueErrorが出た場合 ＝ DBに平文でパスワードが保存されている場合（救済措置）
        return plain_password == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """ログイン成功時に発行するJWTアクセストークンを作成する"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # デフォルトは設定した分数（7日間）
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt