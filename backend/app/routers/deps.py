from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.database import get_db
from app.crud.crud_user import get_user_by_username
from app.schemas.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # デバッグ用プリント
        print(f"DEBUG: 受信したトークン: {token[:10]}...")
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            print("DEBUG: トークンの'sub'が空です")
            raise credentials_exception
            
        print(f"DEBUG: トークン内のユーザー名: {username}")
        token_data = TokenData(username=username)
        
    except JWTError as e:
        print(f"DEBUG: JWTデコード失敗: {e}") # 👈 ここで「Signature has expired」とか出るとビンゴ
        raise credentials_exception

    # DBからユーザーを探す
    user = get_user_by_username(db, username=token_data.username)
    
    if user is None:
        print(f"DEBUG: DBにユーザー '{token_data.username}' が見つかりません")
        raise credentials_exception
        
    print(f"DEBUG: ログイン成功ユーザー: {user.username} (Role: {user.role})")
    return user

def get_current_active_user(current_user = Depends(get_current_user)):
    # If we had an 'is_active' field, we would check it here
    return current_user

def get_current_admin_user(current_user = Depends(get_current_user)):
    if current_user.role not in ["admin", "developer"]:
        raise HTTPException(status_code=403, detail="The user does not have enough privileges")
    return current_user

def get_current_developer_user(current_user = Depends(get_current_user)):
    if current_user.role != "developer":
        raise HTTPException(status_code=403, detail="The user does not have enough privileges")
    return current_user