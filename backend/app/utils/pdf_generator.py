import os
from io import BytesIO
from xhtml2pdf import pisa
from jinja2 import Environment, FileSystemLoader

def create_pdf_from_template(template_name: str, context: dict) -> BytesIO:
    # テンプレートフォルダのパスを取得
    # utilsフォルダの一つ上の階層の templates フォルダ
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_dir = os.path.join(base_dir, 'templates')
    
    # Jinja2環境の設定
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template(template_name)
    
    # HTMLレンダリング
    html_string = template.render(context)
    
    # PDF生成
    buffer = BytesIO()
    pisa_status = pisa.CreatePDF(
        src=html_string,  # HTML文字列
        dest=buffer,      # 出力先バッファ
        encoding='utf-8'  # エンコーディング
    )
    
    if pisa_status.err:
        raise Exception("PDF generation failed")
        
    buffer.seek(0)
    return buffer
