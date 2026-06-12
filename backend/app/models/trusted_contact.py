from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class TrustedContact(Base):
    __tablename__ = "trusted_contacts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    notify_via_sms = Column(Boolean, default=True)
    notify_via_email = Column(Boolean, default=False)
    user = relationship("User", back_populates="contacts")
