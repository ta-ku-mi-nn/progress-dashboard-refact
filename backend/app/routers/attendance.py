from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import httpx
import asyncio
from datetime import datetime, timezone, timedelta
import time  # 🚨 追加：時間を計るツール

router = APIRouter()

# GASのURL
GAS_URL = "https://script.google.com/macros/s/AKfycbxKlWTOAaTJtmOflZsEVjLssdyQ2haOWwD686Omq-13M5SRSszkvyRtGiTuLhG2Fzd-/exec"
JST = timezone(timedelta(hours=9), "JST")

# 🚨 追加：キャッシュ（一時記憶）用の変数
# 60秒間は同じデータを使い回す設定にします
CACHE_TTL = 60 
cache_store = {"data": None, "timestamp": 0}

class CompleteTransferRequest(BaseModel):
    rowNumber: int
    name: str

def parse_gas_date(date_str: str):
    if not date_str: return None
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.astimezone(JST)
    except Exception:
        return None

def get_current_academic_year_range():
    now = datetime.now(JST)
    current_year = now.year
    if now.month < 3:
        target_year = current_year - 1
    else:
        target_year = current_year
    start_dt = datetime(target_year, 3, 1, 0, 0, 0, tzinfo=JST)
    end_dt = datetime(target_year + 1, 3, 1, 0, 0, 0, tzinfo=JST)
    return start_dt, end_dt

@router.get("/transfers")
async def get_transfers(force_refresh: bool = Query(False)):
    """振替・欠席データの取得と計算（キャッシュ付き）"""
    current_time = time.time()

    if not force_refresh and cache_store["data"] is not None:
        if current_time - cache_store["timestamp"] < CACHE_TTL:
            return cache_store["data"]

    async with httpx.AsyncClient() as client:
        for attempt in range(3):
            try:
                response = await client.get(GAS_URL, follow_redirects=True)
                response.raise_for_status()
                data = response.json() # これが {"transfers": [...], "absences": [...]} になります
                break
            except Exception as e:
                if attempt < 2:
                    await asyncio.sleep(1)
                    continue
                raise HTTPException(status_code=500, detail=f"スプレッドシートの読み込みに失敗: {str(e)}")

    start_dt, end_dt = get_current_academic_year_range()
    
    # ----------------------------------------
    # 1. 振替データの処理
    # ----------------------------------------
    transfers_data = data.get("transfers", [])
    pending_transfers = []
    remaining_counts = {}

    for row in transfers_data:
        name = row.get("name")
        if not name: continue

        # タイムスタンプで今年度か判定
        timestamp_str = row.get("timestamp")
        dt_jst = parse_gas_date(timestamp_str)
        if dt_jst and not (start_dt <= dt_jst < end_dt): continue

        orig_date_str = row.get("originalDate")
        orig_dt_jst = parse_gas_date(orig_date_str)
        if orig_dt_jst: row["originalDate"] = orig_dt_jst.strftime("%Y/%m/%d")
        
        # ソート用に、オリジナルの日付オブジェクトを保持しておく（後で消す）
        row["_dt_obj"] = dt_jst 
        if dt_jst: row["timestamp"] = dt_jst.strftime("%Y/%m/%d %H:%M")

        is_completed = row.get("isCompleted") in [True, "TRUE", "true", "True"]

        if not is_completed:
            pending_transfers.append(row)
            remaining_counts[name] = remaining_counts.get(name, 0) + 1
        else:
            if name not in remaining_counts:
                remaining_counts[name] = 0

    # 🚨 振替リストを「新しい順（タイムスタンプの降順）」に並び替え
    pending_transfers.sort(
        key=lambda x: x.get("_dt_obj").timestamp() if x.get("_dt_obj") else 0, 
        reverse=True
    )
    # 邪魔な一時変数を消す
    for row in pending_transfers:
        row.pop("_dt_obj", None)

    # ----------------------------------------
    # 2. 欠席データの処理（新規！）
    # ----------------------------------------
    absences_data = data.get("absences", [])
    absence_counts = {}
    recent_absences = []

    for row in absences_data:
        name = row.get("name")
        if not name: continue

        # タイムスタンプで今年度の欠席だけを抽出
        dt_jst = parse_gas_date(row.get("timestamp"))
        if dt_jst and (start_dt <= dt_jst < end_dt):
            # 今年度の欠席回数をカウントアップ
            absence_counts[name] = absence_counts.get(name, 0) + 1
            
            row["_dt_obj"] = dt_jst
            row["timestamp"] = dt_jst.strftime("%Y/%m/%d %H:%M")
            recent_absences.append(row)

    # 欠席リストも新しい順にソート
    recent_absences.sort(
        key=lambda x: x.get("_dt_obj").timestamp() if x.get("_dt_obj") else 0, 
        reverse=True
    )
    for row in recent_absences:
        row.pop("_dt_obj", None)

    # ----------------------------------------
    # 3. データの結合と保存
    # ----------------------------------------
    result_data = {
        "pending_transfers": pending_transfers,
        "remaining_counts": [{"name": k, "count": v} for k, v in remaining_counts.items()],
        "absence_counts": [{"name": k, "count": v} for k, v in absence_counts.items()], # 🚨 追加：生徒ごとの欠席総数
        "recent_absences": recent_absences # 🚨 追加：欠席リスト
    }

    cache_store["data"] = result_data
    cache_store["timestamp"] = current_time

    return result_data

@router.post("/transfers/complete")
async def complete_transfer(req: CompleteTransferRequest):
    """振替完了の書き込み"""
    async with httpx.AsyncClient() as client:
        try:
            payload = {"rowNumber": req.rowNumber, "name": req.name}
            response = await client.post(GAS_URL, json=payload, follow_redirects=True)
            response.raise_for_status()
            result = response.json()
            
            if not result.get("success"):
                raise HTTPException(status_code=400, detail=result.get("error", "スプレッドシートの更新に失敗しました"))
                
            return {"message": "振替を完了にしました"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"スプレッドシートへの書き込みに失敗しました: {str(e)}")