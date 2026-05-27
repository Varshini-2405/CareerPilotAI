from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from collections import Counter
from app.database import get_db
from app.models.job import Job

router = APIRouter(prefix="/api/salaries", tags=["Salaries & Skills"])

@router.get("/insights")
def get_salary_insights(db: Session = Depends(get_db)):
    # 1. Salary statistics grouped by domain
    domain_stats = (
        db.query(
            Job.domain,
            func.avg(Job.normalized_salary).label("average"),
            func.min(Job.normalized_salary).label("minimum"),
            func.max(Job.normalized_salary).label("maximum"),
            func.count(Job.id).label("count")
        )
        .filter(Job.normalized_salary.isnot(None))
        .filter(Job.normalized_salary <= 350000)
        .group_by(Job.domain)
        .order_by(func.avg(Job.normalized_salary).desc())
        .all()
    )
    
    domain_salaries = [
        {
            "domain": d if d else "General",
            "average": round(avg, 2) if avg else 0,
            "minimum": min_val if min_val else 0,
            "maximum": max_val if max_val else 0,
            "count": count
        }
        for d, avg, min_val, max_val, count in domain_stats
    ]

    # 2. Salary statistics grouped by experience level
    exp_stats = (
        db.query(
            Job.experience_level,
            func.avg(Job.normalized_salary).label("average"),
            func.min(Job.normalized_salary).label("minimum"),
            func.max(Job.normalized_salary).label("maximum"),
            func.count(Job.id).label("count")
        )
        .filter(Job.normalized_salary.isnot(None))
        .filter(Job.normalized_salary <= 350000)
        .group_by(Job.experience_level)
        .all()
    )
    
    experience_salaries = [
        {
            "experience_level": lvl if lvl else "Not Specified",
            "average": round(avg, 2) if avg else 0,
            "minimum": min_val if min_val else 0,
            "maximum": max_val if max_val else 0,
            "count": count
        }
        for lvl, avg, min_val, max_val, count in exp_stats
    ]

    return {
        "domain_salaries": domain_salaries,
        "experience_salaries": experience_salaries
    }

@router.get("/top-skills")
def get_top_skills(
    domain: Optional[str] = Query(None, description="Filter skills by domain"),
    limit: int = Query(10, ge=1, le=50, description="Number of skills to return"),
    db: Session = Depends(get_db)
):
    query = db.query(Job.skills).filter(Job.skills.isnot(None))
    
    if domain:
        query = query.filter(Job.domain == domain)
        
    results = query.all()
    
    # Count skills frequencies
    skills_counter = Counter()
    for row in results:
        skills_string = row[0]
        if skills_string:
            individual_skills = [s.strip() for s in skills_string.split(",") if s.strip()]
            skills_counter.update(individual_skills)
            
    top_skills = [
        {"skill": skill, "count": count}
        for skill, count in skills_counter.most_common(limit)
    ]
    
    return {
        "domain": domain if domain else "All Domains",
        "top_skills": top_skills
    }

@router.get("/predict")
def predict_salary(
    domain: str = Query(..., description="Job domain"),
    experience_level: str = Query(..., description="Job experience level"),
    db: Session = Depends(get_db)
):
    """Predicts salary based on domain and experience level using historical database averages."""
    # Find records matching domain and experience level
    stats = (
        db.query(
            func.avg(Job.normalized_salary).label("average"),
            func.min(Job.normalized_salary).label("minimum"),
            func.max(Job.normalized_salary).label("maximum")
        )
        .filter(Job.domain == domain)
        .filter(Job.experience_level == experience_level)
        .filter(Job.normalized_salary.isnot(None))
        .filter(Job.normalized_salary <= 350000)
        .first()
    )

    if stats and stats.average:
        predicted = round(stats.average, 2)
        min_est = stats.minimum
        max_est = stats.maximum
    else:
        # Fallback to domain average if experience not found
        domain_stats = (
            db.query(func.avg(Job.normalized_salary).label("average"))
            .filter(Job.domain == domain)
            .filter(Job.normalized_salary.isnot(None))
            .filter(Job.normalized_salary <= 350000)
            .first()
        )
        if domain_stats and domain_stats.average:
            predicted = round(domain_stats.average, 2)
            min_est = round(predicted * 0.8, 2)
            max_est = round(predicted * 1.2, 2)
        else:
            # Global fallback
            predicted = 75000.0
            min_est = 50000.0
            max_est = 100000.0

    return {
        "domain": domain,
        "experience_level": experience_level,
        "predicted_salary": predicted,
        "estimated_range": {
            "min": min_est,
            "max": max_est
        },
        "confidence": "Medium (Based on historical average)"
    }
