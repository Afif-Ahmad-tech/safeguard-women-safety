from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    incident_type = Column(String, nullable=False)
    severity = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    area_name = Column(String, nullable=True)
    time_of_day = Column(Integer, nullable=True)
    reported_at = Column(DateTime, default=datetime.utcnow)
    is_verified = Column(Boolean, default=False)
    reporter = relationship("User", back_populates="incidents")
