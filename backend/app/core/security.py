from werkzeug.security import generate_password_hash, check_password_hash

def get_password_hash(password: str) -> str:
    """パスワードをハッシュ化する"""
    return generate_password_hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """入力されたパスワードと、DBのハッシュ済みパスワードを比較する"""
    
    # DBのパスワードが空の場合はFalse
    if not hashed_password:
        return False

    try:
        # 通常のハッシュチェック
        return check_password_hash(hashed_password, plain_password)
    except ValueError:
        # ValueErrorが出た場合 ＝ DBに平文でパスワードが保存されている場合
        # 平文同士で直接比較して、合っていればログインを許可する（救済措置）
        return plain_password == hashed_password