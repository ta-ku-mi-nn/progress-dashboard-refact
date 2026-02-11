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

# ★追加: 更新用スキーマ
class ReportUpdate(BaseModel):
    status: Optional[str] = None
    resolution_message: Optional[str] = None

# --- Endpoints ---

# ... (更新履歴関連は変更なし) ...
@router.get("/changelog", response_model=List[ChangelogResponse])
def get_changelogs(session: Session = Depends(get_db)):
    return session.query(Changelog).order_by(Changelog.id.desc()).all()

# --- バグ報告 ---

@router.get("/bug_reports", response_model=List[ReportResponse])
def get_bug_reports(session: Session = Depends(get_db)):
    return session.query(BugReport).order_by(BugReport.id.desc()).all()

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

# ★追加: バグ報告更新 (管理者用)
@router.patch("/bug_reports/{row_id}")
def update_bug_report(row_id: int, update: ReportUpdate, session: Session = Depends(get_db)):
    item = session.query(BugReport).filter(BugReport.id == row_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    
    if update.status:
        item.status = update.status
    if update.resolution_message is not None:
        item.resolution_message = update.resolution_message
        
    session.commit()
    return {"message": "updated"}

# --- 機能要望 ---

@router.get("/feature_requests", response_model=List[ReportResponse])
def get_feature_requests(session: Session = Depends(get_db)):
    return session.query(FeatureRequest).order_by(FeatureRequest.id.desc()).all()

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

# ★追加: 機能要望更新 (管理者用)
@router.patch("/feature_requests/{row_id}")
def update_feature_request(row_id: int, update: ReportUpdate, session: Session = Depends(get_db)):
    item = session.query(FeatureRequest).filter(FeatureRequest.id == row_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    
    if update.status:
        item.status = update.status
    if update.resolution_message is not None:
        item.resolution_message = update.resolution_message
        
    session.commit()
    return {"message": "updated"}
