# backend/app/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os

# ルーターの定義
router = APIRouter()

# ==========================================
# 🤖 Gemini AIの設定
# ==========================================
# ★ 取得したAPIキーをここに貼り付けます
# （※本番環境では os.environ.get("GEMINI_API_KEY") などを推奨します）
GEMINI_API_KEY = "AIzaSyA-ThDUxJzwxJb8JmZqh379yaEWhkD-Bwc"

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

class ChatMessage(BaseModel):
    message: str

# ==========================================
# APIエンドポイント
# ==========================================
@router.post("/support")
def support_chat(data: ChatMessage):
    """AIサポートチャット用のエンドポイント"""
    
    # AIへの指示書（カンペ）
    system_prompt = """
    あなたは学習塾の業務管理システムのサポートAI「ヘルプBot」です。
    講師や管理者からの質問に、親切かつ簡潔に答えてください。
    
    【よくある質問と回答ルール】
    ・「パスワードを忘れた」「ログインできない」等の質問：
      「パスワードの再発行はシステムからはできません。管理者（塾長）に連絡して、アカウント管理画面から新しいパスワードを設定してもらってください。」と案内する。
    ・「生徒の進捗はどう更新する？」等の質問：
      「ダッシュボード画面から生徒を選択し、参考書ごとの完了ユニット数を入力して保存ボタンを押してください。」と案内する。
    ・システム以外の質問や、わからないこと：
      「申し訳ありません、その質問にはお答えできません。管理者にお問い合わせください。」と返答する。
    """
    
    try:
        # AIに指示書と質問を結合して渡す
        prompt = f"{system_prompt}\n\nユーザーの質問: {data.message}"
        response = model.generate_content(prompt)
        
        return {"reply": response.text}
        
    except Exception as e:
        print(f"AI Chat Error: {e}")
        return {"reply": "現在AIサポートに接続できません。直接管理者にお問い合わせください。"}