from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.database import get_db
from app.models.models import Changelog, BugReport, FeatureRequest

router = APIRouter()

# --- Pydantic Schemas ---

class ChangelogResponse(BaseModel):
    id: int
    version: str
    release_date: str
    title: str
    description: str  # 改行区切りで箇条書きなどを管理する想定

    class Config:
        orm_mode = True

class ReportCreate(BaseModel):
    reporter_username: str
    title: str
    description: str

# --- Endpoints ---

# 1. 更新履歴取得
@router.get("/changelog", response_model=List[ChangelogResponse])
def get_changelogs(session: Session = Depends(get_db)):
    # 新しい順に取得
    return session.query(Changelog).order_by(Changelog.id.desc()).all()

# 2. バグ報告送信
@router.post("/bug_reports")
def create_bug_report(report: ReportCreate, session: Session = Depends(get_db)):
    new_report = BugReport(
        reporter_username=report.reporter_username,
        report_date=datetime.now().strftime('%Y-%m-%d'), # 文字列型に合わせてフォーマット
        title=report.title,
        description=report.description,
        status="未対応"
    )
    session.add(new_report)
    session.commit()
    return {"message": "Bug report created"}

# 3. 機能要望送信
@router.post("/feature_requests")
def create_feature_request(report: ReportCreate, session: Session = Depends(get_db)):
    new_request = FeatureRequest(
        reporter_username=report.reporter_username,
        report_date=datetime.now().strftime('%Y-%m-%d'),
        title=report.title,
        description=report.description,
        status="未対応"
    )
    session.add(new_request)
    session.commit()
    return {"message": "Feature request created"}
