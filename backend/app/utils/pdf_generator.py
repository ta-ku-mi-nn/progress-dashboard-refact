# backend/app/utils/pdf_generator.py

from xhtml2pdf import pisa
from io import BytesIO
from fastapi.templating import Jinja2Templates
import os
import urllib.request
import zipfile

# パス設定
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
FONTS_DIR = os.path.join(BASE_DIR, "fonts") # フォント保存用フォルダ
FONT_PATH = os.path.join(FONTS_DIR, "ipaexg.ttf") # フォントファイルパス

templates = Jinja2Templates(directory=TEMPLATES_DIR)

def ensure_japanese_font():
    """
    日本語フォント(IPAexゴシック)が存在しない場合、ダウンロードして配置する
    """
    if os.path.exists(FONT_PATH):
        return FONT_PATH

    print("Downloading Japanese font (IPAexGothic)...")
    try:
        os.makedirs(FONTS_DIR, exist_ok=True)
        # IPAexゴシックのダウンロードURL
        url = "https://moji.or.jp/wp-content/ipafont/IPAexfont/IPAexfont00401.zip"
        zip_path = os.path.join(FONTS_DIR, "font.zip")
        
        # ダウンロード
        urllib.request.urlretrieve(url, zip_path)
        
        # 解凍してttfを取り出す
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for file in zip_ref.namelist():
                if file.endswith("ipaexg.ttf"):
                    # フォルダ階層を無視してFONTS_DIR直下に保存
                    with zip_ref.open(file) as source, open(FONT_PATH, "wb") as target:
                        target.write(source.read())
                    break
        
        # 後始末
        if os.path.exists(zip_path):
            os.remove(zip_path)
            
        print("Font downloaded successfully.")
        return FONT_PATH
    except Exception as e:
        print(f"Failed to download font: {e}")
        return None

def create_pdf_from_template(template_name: str, context: dict) -> BytesIO:
    """
    Jinja2テンプレートとデータからPDFを生成する
    """
    # フォントの準備（パスをコンテキストに追加）
    font_path = ensure_japanese_font()
    if font_path:
        # Windows環境などでパスの区切り文字が問題になる場合への対処
        context["font_path"] = font_path.replace("\\", "/")
    else:
        context["font_path"] = ""

    # テンプレートレンダリング
    template = templates.get_template(template_name)
    html_content = template.render(context)

    # PDF生成
    buffer = BytesIO()
    pisa_status = pisa.CreatePDF(
        src=html_content,
        dest=buffer,
        encoding='utf-8'
    )

    if pisa_status.err:
        raise Exception("PDF generation failed")

    buffer.seek(0)
    return buffer