from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.job import Job

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("")
def get_analytics(db: Session = Depends(get_db)):
    # 1. Get total jobs in system
    total_jobs = db.query(Job).count()
    if total_jobs == 0:
        return {
            "total_jobs": 0,
            "domain_distribution": [],
            "experience_distribution": [],
            "remote_ratio": {"remote": 0, "onsite": 0}
        }

    # 2. Get distribution by domain
    domain_counts = (
        db.query(Job.domain, func.count(Job.id))
        .group_by(Job.domain)
        .order_by(func.count(Job.id).desc())
        .all()
    )
    domain_distribution = [
        {"domain": domain if domain else "General", "count": count}
        for domain, count in domain_counts
    ]

    # 3. Get distribution by experience level
    exp_counts = (
        db.query(Job.experience_level, func.count(Job.id))
        .group_by(Job.experience_level)
        .all()
    )
    experience_distribution = [
        {"experience_level": exp if exp else "Not Specified", "count": count}
        for exp, count in exp_counts
    ]

    # 4. Get remote vs onsite ratio
    remote_counts = (
        db.query(Job.remote_allowed, func.count(Job.id))
        .group_by(Job.remote_allowed)
        .all()
    )
    
    remote = 0
    onsite = 0
    for is_remote, count in remote_counts:
        if is_remote:
            remote += count
        else:
            onsite += count

    # 5. Get top hiring locations
    location_counts = (
        db.query(Job.location, func.count(Job.id))
        .group_by(Job.location)
        .order_by(func.count(Job.id).desc())
        .limit(5)
        .all()
    )
    top_locations = [
        {"location": loc if loc else "Unknown", "count": count}
        for loc, count in location_counts
    ]

    return {
        "total_jobs": total_jobs,
        "domain_distribution": domain_distribution,
        "experience_distribution": experience_distribution,
        "remote_ratio": {
            "remote": remote,
            "onsite": onsite
        },
        "top_locations": top_locations
    }
