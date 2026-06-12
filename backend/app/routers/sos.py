from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models.sos_alert import SOSAlert
from app.models.trusted_contact import TrustedContact
from app.models.user import User
from app.services.notification import (
    send_email_alert, send_sms_alert,
    send_whatsapp_alert, make_voice_call,
    send_push_notification
)
from typing import Dict, List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)

manager = ConnectionManager()

class SOSTriggerRequest(BaseModel):
    user_id: int
    latitude: float
    longitude: float
    message: str = "I need help! Please check on me immediately."

@router.post("/trigger")
async def trigger_sos(req: SOSTriggerRequest, db: AsyncSession = Depends(get_db)):
    alert = SOSAlert(
        user_id=req.user_id,
        latitude=req.latitude,
        longitude=req.longitude,
        message=req.message
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    user_result = await db.execute(select(User).where(User.id == req.user_id))
    user = user_result.scalar_one_or_none()
    user_name = user.name if user else "SafeGuard User"
    user_phone = user.phone if user else "Unknown"

    contacts_result = await db.execute(
        select(TrustedContact).where(TrustedContact.user_id == req.user_id)
    )
    contacts = contacts_result.scalars().all()

    maps_link = f"https://maps.google.com/?q={req.latitude},{req.longitude}"
    time_str = datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')

    email_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;
      background:#0f0f0f;color:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background:#e74c3c;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:28px;">🚨 EMERGENCY SOS ALERT</h1>
      </div>
      <div style="padding:24px;background:#1a1a2e;border:2px solid #e74c3c;
        border-top:none;border-radius:0 0 12px 12px;">
        <div style="background:#2b0a0a;border-radius:8px;padding:16px;
          margin-bottom:16px;border-left:4px solid #e74c3c;">
          <p style="font-size:20px;margin:0 0 8px;color:#ffffff;">
            <strong>{user_name}</strong> needs your help RIGHT NOW!
          </p>
          <p style="color:#aaa;margin:0;font-size:14px;">
            📱 Call them: <strong style="color:#fff;font-size:16px;">{user_phone}</strong>
          </p>
        </div>
        <p style="color:#ccc;font-size:15px;margin-bottom:16px;">
          <strong>Message:</strong> {req.message}
        </p>
        <div style="background:#0a2b15;border-radius:8px;padding:16px;
          margin-bottom:16px;border:1px solid #27ae6055;">
          <p style="color:#27ae60;font-weight:bold;margin:0 0 8px;font-size:16px;">
            📍 Live Location
          </p>
          <a href="{maps_link}" style="color:#e74c3c;font-size:14px;word-break:break-all;">
            {maps_link}
          </a>
          <p style="color:#888;margin:8px 0 0;font-size:12px;">
            Coordinates: {req.latitude:.6f}, {req.longitude:.6f}
          </p>
        </div>
        <p style="color:#666;font-size:12px;margin-bottom:20px;">
          ⏰ Alert triggered: {time_str}
        </p>
        <div style="text-align:center;">
          <a href="{maps_link}"
            style="display:inline-block;background:#e74c3c;color:#fff;
            padding:14px 28px;border-radius:8px;text-decoration:none;
            font-weight:bold;font-size:16px;">
            📍 Open Location in Maps
          </a>
        </div>
        <p style="color:#555;font-size:11px;text-align:center;margin-top:20px;">
          Sent via SafeGuard — Women Safety Network · UN SDG #3
        </p>
      </div>
    </div>
    """

    sms_body = (
        f"🚨 SOS ALERT!\n"
        f"{user_name} NEEDS HELP NOW!\n"
        f"📱 Call: {user_phone}\n"
        f"📍 Location: {maps_link}\n"
        f"Time: {time_str}\n"
        f"PLEASE RESPOND IMMEDIATELY!"
    )

    email_count = 0
    sms_count = 0
    whatsapp_count = 0
    call_count = 0

    for contact in contacts:
        if contact.email:
            ok = await send_email_alert(
                contact.email,
                f"🚨 URGENT SOS: {user_name} needs help NOW!",
                email_html
            )
            if ok: email_count += 1

        if contact.phone:
            if contact.notify_via_sms:
                ok = await send_sms_alert(contact.phone, sms_body)
                if ok: sms_count += 1
            ok = await send_whatsapp_alert(contact.phone, user_name, maps_link)
            if ok: whatsapp_count += 1
            ok = await make_voice_call(contact.phone, user_name, maps_link)
            if ok: call_count += 1

    print(f"SOS by {user_name} | Email:{email_count} SMS:{sms_count} WA:{whatsapp_count} Call:{call_count}")

    return {
        "alert_id": alert.id,
        "status": "active",
        "contacts_notified": len(contacts),
        "email_sent": email_count,
        "sms_sent": sms_count,
        "whatsapp_sent": whatsapp_count,
        "calls_made": call_count,
        "triggered_at": alert.triggered_at.isoformat()
    }

@router.put("/resolve/{alert_id}")
async def resolve_sos(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SOSAlert).where(SOSAlert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return {"error": "Alert not found"}

    alert.status = "resolved"
    alert.resolved_at = datetime.utcnow()
    await db.commit()

    # Get user info
    user_result = await db.execute(select(User).where(User.id == alert.user_id))
    user = user_result.scalar_one_or_none()
    user_name = user.name if user else "SafeGuard User"
    user_phone = user.phone if user else "Unknown"

    # Get contacts
    contacts_result = await db.execute(
        select(TrustedContact).where(TrustedContact.user_id == alert.user_id)
    )
    contacts = contacts_result.scalars().all()

    time_str = datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')
    maps_link = f"https://maps.google.com/?q={alert.latitude},{alert.longitude}"

    safe_email_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;
      background:#0f0f0f;color:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background:#27ae60;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:28px;">✅ SAFE — SOS RESOLVED</h1>
      </div>
      <div style="padding:24px;background:#1a1a2e;border:2px solid #27ae60;
        border-top:none;border-radius:0 0 12px 12px;">
        <div style="background:#0a2b15;border-radius:8px;padding:16px;
          margin-bottom:16px;border-left:4px solid #27ae60;">
          <p style="font-size:20px;margin:0 0 8px;color:#ffffff;">
            <strong>{user_name}</strong> is now SAFE! ✅
          </p>
          <p style="color:#aaa;margin:0;font-size:14px;">
            They have marked themselves as safe and the emergency is resolved.
          </p>
        </div>

        <div style="text-align:center;padding:20px 0;">
          <div style="font-size:64px;">✅</div>
          <p style="color:#27ae60;font-size:22px;font-weight:bold;margin:8px 0;">
            {user_name} is Safe!
          </p>
          <p style="color:#888;font-size:14px;">
            No further action needed. Thank you for being there for them.
          </p>
        </div>

        <div style="background:#0f0f1a;border-radius:8px;padding:14px;
          margin-bottom:16px;border:1px solid #2a2a4a;">
          <p style="color:#aaa;font-size:13px;margin:0 0 6px;">
            📱 Their number: <strong style="color:#fff;">{user_phone}</strong>
          </p>
          <p style="color:#aaa;font-size:13px;margin:0 0 6px;">
            📍 Last known location:
            <a href="{maps_link}" style="color:#27ae60;">{maps_link}</a>
          </p>
          <p style="color:#aaa;font-size:13px;margin:0;">
            ⏰ Alert resolved at: <strong style="color:#fff;">{time_str}</strong>
          </p>
        </div>

        <div style="background:#1a2b1a;border-radius:8px;padding:14px;
          margin-bottom:20px;border:1px solid #27ae6033;">
          <p style="color:#27ae60;font-size:13px;margin:0;text-align:center;">
            💚 You responded to an emergency alert.
            You may have just saved someone's life.
            Thank you for being a trusted contact.
          </p>
        </div>

        <p style="color:#555;font-size:11px;text-align:center;margin-top:16px;">
          Sent via SafeGuard — Women Safety Network · UN SDG #3
        </p>
      </div>
    </div>
    """

    safe_sms = (
        f"✅ SAFE ALERT\n"
        f"{user_name} is now SAFE!\n"
        f"The SOS emergency has been resolved.\n"
        f"No further action needed.\n"
        f"Thank you for being there! 💚\n"
        f"— SafeGuard"
    )

    for contact in contacts:
        if contact.email:
            await send_email_alert(
                contact.email,
                f"✅ {user_name} is Safe — SOS Resolved",
                safe_email_html
            )
        if contact.notify_via_sms and contact.phone:
            await send_sms_alert(contact.phone, safe_sms)

    print(f"SAFE notification sent for {user_name} to {len(contacts)} contacts")

    return {
        "status": "resolved",
        "safe_notifications_sent": len(contacts),
        "resolved_at": alert.resolved_at.isoformat()
    }

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
            await websocket.send_text(
                json.dumps({"type":"ping","ts":str(datetime.utcnow())})
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
