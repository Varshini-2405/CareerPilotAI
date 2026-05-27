from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from collections import Counter
import random

from app.database import get_db
from app.models.job import Job
from app.services.nlp_service import (
    extract_text_from_pdf,
    extract_skills_from_text,
    SKILL_DICTIONARY
)
from app.utils.data_loader import classify_domain

router = APIRouter(prefix="/api/ml", tags=["Machine Learning & NLP"])

@router.post("/resume-analysis")
async def analyze_resume(
    file: UploadFile = File(...),
    target_job: str = Form(..., description="Target Job Title (e.g. Software Engineer, Data Scientist)"),
    db: Session = Depends(get_db)
):
    try:
        # 1. Read file bytes and parse text
        contents = await file.read()
        filename = file.filename
        
        if filename.endswith(".pdf"):
            text = extract_text_from_pdf(contents)
        else:
            # Fallback for plain text files
            try:
                text = contents.decode("utf-8")
            except UnicodeDecodeError:
                text = contents.decode("latin-1")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the resume file. Please upload a readable PDF or TXT file.")

        # 2. Extract CV skills
        extracted_skills = extract_skills_from_text(text)

        # 3. Determine target requirements from the database
        # Query up to 100 jobs matching the target job title to find actual skill demands by parsing descriptions
        title_pattern = f"%{target_job}%"
        jobs_query = (
            db.query(Job.description, Job.domain)
            .filter(Job.title.like(title_pattern))
            .limit(50)
            .all()
        )

        target_requirements = []
        inferred_domain = "Software"

        if jobs_query:
            # Count skills frequencies by scanning the job descriptions
            skills_counter = Counter()
            domain_counter = Counter()
            
            for row in jobs_query:
                description, domain = row
                if domain:
                    domain_counter[domain] += 1
                if description:
                    # Extract technical skills from the job description
                    job_skills = extract_skills_from_text(description)
                    skills_counter.update(job_skills)
            
            # Select top 12 most common technical tools demanded in job descriptions
            target_requirements = [skill for skill, count in skills_counter.most_common(12)]
            if domain_counter:
                inferred_domain = domain_counter.most_common(1)[0][0]
        
        # Fallback if no matching jobs in database: Classify using domain rules
        if not target_requirements:
            inferred_domain = classify_domain(target_job, "")
            # Use the default competencies mapped for this domain
            domain_skills = SKILL_DICTIONARY.get(inferred_domain, SKILL_DICTIONARY["Software"])
            target_requirements = domain_skills[:12]

        # 4. Compare CV skills against requirements
        extracted_lower = {s.lower() for s in extracted_skills}
        
        matched_skills = []
        missing_skills = []
        
        for req in target_requirements:
            if req.lower() in extracted_lower:
                matched_skills.append(req)
            else:
                missing_skills.append(req)

        # 5. Calculate match compatibility score (Flexible & Dynamic)
        if not extracted_skills:
            score = 0
        else:
            # Coverage: how many requirements they meet (out of the top 12)
            coverage = len(matched_skills) / len(target_requirements) if target_requirements else 0
            
            # Focus: how many of their resume skills are relevant to the target domain
            domain_skills_set = {s.lower() for s in SKILL_DICTIONARY.get(inferred_domain, [])}
            relevant_extracted = [s for s in extracted_skills if s.lower() in domain_skills_set]
            focus = len(relevant_extracted) / len(extracted_skills) if extracted_skills else 0
            
            # Weighted average: 70% coverage, 30% focus
            score = int((coverage * 0.70 + focus * 0.30) * 100)
            
            # Skill density bonus to differentiate resumes
            bonus = min(15, len(matched_skills) * 3)
            score += bonus

        score = max(5, min(100, score))  # bound score

        # 6. Generate action recommendations
        recommendations = []
        for missing in missing_skills[:3]:
            recommendations.append(f"Acquire the key competency '{missing}' by building a portfolio project tailored for {target_job} roles.")
        
        # Domain-specific tips
        domain_tips = {
            "AI/ML": [
                "Optimize your pipeline familiarity by deploying a predictive scikit-learn model via FastAPI.",
                "Create a public GitHub repository showcasing data preparation and model evaluation scripts."
            ],
            "Cloud": [
                "Focus on infrastructure as code tools (e.g., Terraform) and container orchestration.",
                "Build a cloud-native deployment with automated GitHub Actions CI/CD pipelines."
            ],
            "Cybersecurity": [
                "Practice network scanning and log analysis inside isolated virtual sandbox environments.",
                "Study security framework compliance standards (e.g. OWASP Top 10, ISO 27001)."
            ],
            "Software": [
                "Strengthen your full-stack design patterns by implementing client-state synchronization.",
                "Build modular REST APIs verifying correct HTTP response statuses and data types."
            ]
        }
        
        # Pull corresponding domain advice
        tips = domain_tips.get(inferred_domain, [
            f"Focus on core tools and frameworks standard in the {inferred_domain} sector.",
            f"Develop practical projects demonstrating proficiency in {inferred_domain} applications."
        ])
        recommendations.append(tips[0])
        
        # Score-based advice
        if score >= 85:
            recommendations.append(f"Outstanding match! Highlight key scaling metrics (e.g., speed, load capacity, or cost reduction) on your resume for {target_job} applications.")
        elif score >= 60:
            recommendations.append("Good baseline compatibility. Integrate your target technologies directly into past job descriptions using active verbs.")
        else:
            recommendations.append(f"Currently, there is a significant skill gap for {target_job}. Focus on learning the missing core technologies before applying.")

        return {
            "filename": filename,
            "target_job": target_job,
            "inferred_domain": inferred_domain,
            "score": score,
            "extracted_skills": extracted_skills,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "recommendations": recommendations
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error during CV analysis: {str(e)}")

@router.post("/career-recommendation")
def get_career_recommendations(
    skills: str = Form(..., description="Comma separated list of current skills (e.g. Java, HTML)"),
    interest: str = Form(..., description="Target Domain of Interest (e.g. AI/ML, Cloud)"),
    experience_years: float = Form(..., description="Years of experience"),
    db: Session = Depends(get_db)
):
    try:
        user_skills = [s.strip() for s in skills.split(",") if s.strip()]
        user_skills_lower = {s.lower() for s in user_skills}
        
        # 1. Query database for jobs in the target domain
        jobs = (
            db.query(Job.title, Job.description, Job.normalized_salary)
            .filter(Job.domain == interest)
            .limit(50)
            .all()
        )

        # 2. Extract common job titles and skills from descriptions
        title_counter = Counter()
        skill_counter = Counter()
        salaries = []

        for row in jobs:
            title, description, salary = row
            if title:
                title_counter[title] += 1
            if salary:
                salaries.append(salary)
            if description:
                # Scan job description for core technical tools
                job_skills = extract_skills_from_text(description)
                skill_counter.update(job_skills)

        # Common job titles
        common_roles = [title for title, count in title_counter.most_common(4)]
        if not common_roles:
            # Fallback values
            pathway_defaults = {
                "AI/ML": ["Junior Data Analyst", "Machine Learning Engineer", "NLP Researcher", "Data Scientist"],
                "Cloud": ["DevOps Engineer", "Cloud Infrastructure Analyst", "Site Reliability Engineer", "Platform Architect"],
                "Cybersecurity": ["SOC Analyst", "Information Security Officer", "Security Engineer", "Penetration Tester"],
                "Software": ["Frontend Developer", "Backend Developer", "Fullstack Engineer", "Software Developer"]
            }
            common_roles = pathway_defaults.get(interest, pathway_defaults["Software"])

        # Format roles according to years of experience
        recommended_roles = []
        for role in common_roles:
            if experience_years < 2.0:
                recommended_roles.append(f"Junior {role}" if "junior" not in role.lower() else role)
            elif experience_years > 5.0:
                recommended_roles.append(f"Senior / Lead {role}" if "senior" not in role.lower() else role)
            else:
                recommended_roles.append(role)

        # Find skill gap (what is common in DB that user does not have)
        missing_common = []
        for skill, count in skill_counter.most_common(20):
            if skill.lower() not in user_skills_lower:
                missing_common.append(skill)
                if len(missing_common) >= 3:
                    break

        # 3. Certification and Project Suggestions based on domain
        certifications_map = {
            "AI/ML": [
                "AWS Certified Machine Learning - Specialty",
                "Google Professional Data Engineer",
                "TensorFlow Developer Certificate"
            ],
            "Cloud": [
                "AWS Certified Solutions Architect - Associate",
                "Certified Kubernetes Administrator (CKA)",
                "HashiCorp Certified: Terraform Associate"
            ],
            "Cybersecurity": [
                "CompTIA Security+",
                "Certified Information Systems Security Professional (CISSP)",
                "Certified Ethical Hacker (CEH)"
            ],
            "Software": [
                "Meta Front-End / Back-End Developer Certificate",
                "AWS Certified Developer - Associate",
                "Oracle Certified Associate: Java Programmer"
            ]
        }
        certifications = certifications_map.get(interest, certifications_map["Software"])

        projects_map = {
            "AI/ML": [
                "Develop an end-to-end regression model to predict salaries using scikit-learn and deploy it via FastAPI.",
                "Build a text summarization tool using Hugging Face transformers and index a custom PDF parser."
            ],
            "Cloud": [
                "Deploy a multi-tier containerized web application on AWS EKS using Helm charts.",
                "Write a modular Terraform configuration to build a secure VPC with multiple subnets and load balancers."
            ],
            "Cybersecurity": [
                "Set up a local network sandbox and configure Snort IDS to inspect and block malformed packets.",
                "Build a credentials-manager dashboard in React implementing JSON Web Tokens (JWT) and secure salting."
            ],
            "Software": [
                "Create a fully responsive React and Tailwind SaaS Dashboard utilizing Recharts for metrics mapping.",
                "Implement a backend REST API with FastAPI, SQLAlchemy, and SQLite containing full test validation suites."
            ]
        }
        projects = projects_map.get(interest, projects_map["Software"])

        # Determine average salary
        avg_salary = int(sum(salaries) / len(salaries)) if salaries else 85000
        # Scale average salary slightly based on experience
        if experience_years > 5.0:
            avg_salary = int(avg_salary * 1.3)
        elif experience_years < 2.0:
            avg_salary = int(avg_salary * 0.8)

        return {
            "target_interest": interest,
            "experience_years": experience_years,
            "input_skills": user_skills,
            "recommended_roles": recommended_roles,
            "certifications": certifications,
            "recommended_projects": projects,
            "missing_skills": missing_common,
            "estimated_target_salary": avg_salary,
            "market_demand": "High" if interest in ["AI/ML", "Cloud", "Cybersecurity"] else "Medium"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error during career planning: {str(e)}")
