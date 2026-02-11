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
    description: str

    class Config:
        orm_mode = True

class ReportCreate(BaseModel):
    reporter_username: str
    title: str
    description: str

# ★追加: レスポンス用のモデル (GETで返す用)
class ReportResponse(BaseModel):
    id: int
    reporter_username: str
    report_date: str
    title: str
    description: str
    status: str
    resolution_message: Optional[str] = None

    class Config:
        orm_mode = True

# --- Endpoints ---

# 1. 更新履歴取得
@router.get("/changelog", response_model=List[ChangelogResponse])
def get_changelogs(session: Session = Depends(get_db)):
    return session.query(Changelog).order_by(Changelog.id.desc()).all()

# --- バグ報告 ---

# ★追加: バグ報告一覧取得 (GET)
@router.get("/bug_reports", response_model=List[ReportResponse])
def get_bug_reports(session: Session = Depends(get_db)):
    return session.query(BugReport).order_by(BugReport.id.desc()).all()

# バグ報告送信 (POST)
@router.post("/bug_reports")
def create_bug_report(report: ReportCreate, session: Session = Depends(get_db)):
    new_report = BugReport(
        reporter_username=report.reporter_username,
        report_date=datetime.now().strftime('%Y-%m-%d'),
        title=report.title,
        description=report.description,
        status="未対応"
    )
    session.add(new_report)
    session.commit()
    return {"message": "Bug report created"}

# --- 機能要望 ---

# ★追加: 機能要望一覧取得 (GET)
@router.get("/feature_requests", response_model=List[ReportResponse])
def get_feature_requests(session: Session = Depends(get_db)):
    return session.query(FeatureRequest).order_by(FeatureRequest.id.desc()).all()

# 機能要望送信 (POST)
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
