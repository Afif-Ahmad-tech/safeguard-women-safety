from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.trusted_contact import TrustedContact

router = APIRouter()

class ContactCreate(BaseModel):
    user_id: int
    name: str
    phone: str
    email: Optional[str] = None
    notify_via_sms: bool = True
    notify_via_email: bool = False

@router.post("/add")
async def add_contact(req: ContactCreate, db: AsyncSession = Depends(get_db)):
    contact = TrustedContact(**req.dict())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return {"id": contact.id, "name": contact.name, "status": "added"}

@router.get("/{user_id}")
async def get_contacts(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrustedContact).where(TrustedContact.user_id == user_id))
    contacts = result.scalars().all()
    return [{"id": c.id, "name": c.name, "phone": c.phone, "email": c.email} for c in contacts]

@router.delete("/{contact_id}")
async def delete_contact(contact_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrustedContact).where(TrustedContact.id == contact_id))
    c = result.scalar_one_or_none()
    if c:
        await db.delete(c)
        await db.commit()
    return {"status": "deleted"}