# backend/reset_db.py
from app.db.database import engine
from app.models import models

print("🗑️ テーブルを削除しています...")
# 既存のテーブルをドロップ
models.AbsenceReport.__table__.drop(engine, checkfirst=True)
models.TransferRequest.__table__.drop(engine, checkfirst=True)
print("✅ 削除完了！")

print("✨ テーブルを最新の状態で再構築しています...")
# 最新のモデル定義で作り直し
models.Base.metadata.create_all(bind=engine)
print("✅ 再構築完了！完璧です！")