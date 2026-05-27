from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from app.database import get_db
from app.models.job import Job
import math

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.get("")
def get_jobs(
    search: Optional[str] = Query(None, description="Search by title, company, description, or skills"),
    domain: Optional[str] = Query(None, description="Filter by domain (e.g. Software, AI/ML)"),
    location: Optional[str] = Query(None, description="Filter by location"),
    work_type: Optional[str] = Query(None, description="Filter by work type (e.g. Full-time)"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level"),
    remote: Optional[bool] = Query(None, description="Filter by remote allowed"),
    min_salary: Optional[float] = Query(None, description="Minimum normalized salary"),
    max_salary: Optional[float] = Query(None, description="Maximum normalized salary"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    
    # Apply filters
    filters = []
    
    if search:
        search_pattern = f"%{search}%"
        filters.append(
            or_(
                Job.title.like(search_pattern),
                Job.company_name.like(search_pattern),
                Job.description.like(search_pattern),
                Job.skills.like(search_pattern)
            )
        )
        
    if domain:
        filters.append(Job.domain == domain)
        
    if location:
        filters.append(Job.location.like(f"%{location}%"))
        
    if work_type:
        filters.append(Job.work_type == work_type)
        
    if experience_level:
        filters.append(Job.experience_level == experience_level)
        
    if remote is not None:
        filters.append(Job.remote_allowed == remote)
        
    if min_salary is not None:
        filters.append(Job.normalized_salary >= min_salary)
        
    if max_salary is not None:
        filters.append(Job.normalized_salary <= max_salary)
        
    if filters:
        query = query.filter(and_(*filters))
        
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    jobs = query.order_by(Job.id.desc()).offset(offset).limit(limit).all()
    
    # Calculate pages
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 0
    
    return {
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "company_name": j.company_name,
                "description": j.description[:200] + "..." if j.description else "",
                "location": j.location,
                "work_type": j.work_type,
                "experience_level": j.experience_level,
                "remote_allowed": j.remote_allowed,
                "min_salary": j.min_salary,
                "max_salary": j.max_salary,
                "med_salary": j.med_salary,
                "pay_period": j.pay_period,
                "normalized_salary": j.normalized_salary,
                "domain": j.domain,
                "skills": j.skills.split(", ") if j.skills else []
            }
            for j in jobs
        ],
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/{job_id}")
def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return {"error": "Job not found"}
        
    return {
        "id": job.id,
        "title": job.title,
        "company_name": job.company_name,
        "description": job.description,
        "location": job.location,
        "work_type": job.work_type,
        "experience_level": job.experience_level,
        "remote_allowed": job.remote_allowed,
        "min_salary": job.min_salary,
        "max_salary": job.max_salary,
        "med_salary": job.med_salary,
        "pay_period": job.pay_period,
        "normalized_salary": job.normalized_salary,
        "domain": job.domain,
        "skills": job.skills.split(", ") if job.skills else []
    }
