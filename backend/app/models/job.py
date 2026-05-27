from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=True)
    company_name = Column(String, index=True, nullable=True)
    description = Column(String, nullable=True)
    location = Column(String, index=True, nullable=True)
    work_type = Column(String, nullable=True)
    experience_level = Column(String, index=True, nullable=True)
    remote_allowed = Column(Boolean, default=False, nullable=True)
    min_salary = Column(Float, nullable=True)
    max_salary = Column(Float, nullable=True)
    med_salary = Column(Float, nullable=True)
    pay_period = Column(String, nullable=True)
    normalized_salary = Column(Float, index=True, nullable=True)
    domain = Column(String, index=True, nullable=True)
    skills = Column(String, nullable=True)  # Store skills as comma-separated values (e.g., "Python, SQL, Docker")
