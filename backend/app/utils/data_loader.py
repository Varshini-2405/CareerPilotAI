import os
import pandas as pd
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db, engine
from app.models.job import Job

# Define data paths
DATA_DIR = r"c:\Users\Varshini M\Desktop\CareerpilotAI\data\archive (1)"
POSTINGS_PATH = os.path.join(DATA_DIR, "postings.csv")
JOB_SKILLS_PATH = os.path.join(DATA_DIR, "jobs", "job_skills.csv")
SKILLS_PATH = os.path.join(DATA_DIR, "mappings", "skills.csv")

# Domain classification keywords (priority matching order)
DOMAIN_KEYWORDS = {
    "AI/ML": [
        "machine learning", "deep learning", "artificial intelligence", "data scientist", 
        "data science", "nlp", "computer vision", "tensorflow", "pytorch", "mlops", 
        "neural network", "ai engineer", "ml engineer", "reinforcement learning"
    ],
    "Cybersecurity": [
        "cyber", "security", "infosec", "penetration", "cryptography", "firewall", 
        "soc analyst", "threat", "vulnerability", "incident response", "information security",
        "cybersecurity", "security analyst"
    ],
    "Cloud": [
        "cloud", "aws", "azure", "gcp", "devops", "kubernetes", "docker", "site reliability", 
        "sre", "platform engineer", "infrastructure engineer", "cloud architect"
    ],
    "Software": [
        "software engineer", "developer", "backend", "frontend", "full stack", 
        "programmer", "web developer", "python developer", "java", "c++", "net developer", 
        "c#", "software developer", "application engineer", "coder"
    ],
    "Finance": [
        "finance", "financial", "accounting", "accountant", "analyst", "investment", 
        "banking", "tax", "audit", "treasury", "portfolio manager", "corporate finance"
    ],
    "Marketing": [
        "marketing", "digital marketing", "seo", "social media", "brand manager", 
        "content writer", "copywriter", "pr manager", "public relations", "marketing coordinator"
    ],
    "HR": [
        "hr ", "human resources", "recruiter", "talent acquisition", "people ops", 
        "employee relations", "hr specialist", "human resource"
    ],
    "Mechanical": [
        "mechanical", "cad", "solidworks", "thermodynamics", "automotive engineer", 
        "hvac engineer", "product designer", "mechanical design"
    ],
    "Civil": [
        "civil engineer", "structural engineer", "autocad", "geotechnical", 
        "construction manager", "quantity surveyor", "civil engineering"
    ],
    "Electronics": [
        "electronics", "electrical", "hardware engineer", "pcb", "embedded systems", 
        "microcontroller", "circuit designer", "electrical engineering"
    ]
}

def classify_domain(title: str, description: str) -> str:
    """Classifies a job into a domain based on keywords in title and description."""
    title_lower = str(title).lower() if pd.notna(title) else ""
    desc_lower = str(description).lower() if pd.notna(description) else ""
    
    # Check title first (higher confidence)
    for domain, keywords in DOMAIN_KEYWORDS.items():
        for keyword in keywords:
            if keyword in title_lower:
                return domain
                
    # Check description as fallback
    for domain, keywords in DOMAIN_KEYWORDS.items():
        for keyword in keywords:
            if keyword in desc_lower:
                return domain
                
    return "General"

def seed_database():
    """Main ETL pipeline to clean and load the dataset into SQLite."""
    print("Initializing Database tables...")
    init_db()
    
    db: Session = SessionLocal()
    try:
        # Check if database is already seeded
        existing_count = db.query(Job).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} jobs. Skipping seeding.")
            return

        print("Loading dataset files...")
        if not os.path.exists(POSTINGS_PATH):
            print(f"Postings file not found at: {POSTINGS_PATH}")
            return
            
        # 1. Load postings and filter for rows with salary details
        print("Reading postings.csv...")
        postings_df = pd.read_csv(POSTINGS_PATH)
        print(f"Loaded {len(postings_df)} raw postings.")
        
        # Filter for rows with salary details to ensure high-quality training and analytics data
        salary_df = postings_df[postings_df["normalized_salary"].notna()].copy()
        print(f"Filtered to {len(salary_df)} jobs with salary details.")

        # 2. Load and merge skills mapping
        skills_list = []
        if os.path.exists(JOB_SKILLS_PATH) and os.path.exists(SKILLS_PATH):
            print("Reading and merging job skills mapping...")
            job_skills_df = pd.read_csv(JOB_SKILLS_PATH)
            skills_mapping_df = pd.read_csv(SKILLS_PATH)
            
            merged_skills = pd.merge(job_skills_df, skills_mapping_df, on="skill_abr")
            
            # Aggregate skills per job
            print("Aggregating skills per job_id...")
            skills_grouped = merged_skills.groupby("job_id")["skill_name"].apply(lambda x: ", ".join(x)).reset_index()
            skills_grouped.rename(columns={"skill_name": "skills_list"}, inplace=True)
            
            # Merge with our postings
            salary_df = pd.merge(salary_df, skills_grouped, on="job_id", how="left")
            print("Skills successfully merged.")
        else:
            print("Skills dataset files not found. Mapped skills will be empty.")
            salary_df["skills_list"] = None

        # 3. Apply domain classification
        print("Classifying job domains...")
        salary_df["domain"] = salary_df.apply(
            lambda row: classify_domain(row["title"], row["description"]), axis=1
        )
        
        # 4. Map columns to match our Job model
        print("Formatting data for DB insertion...")
        # Replace NaN values with None for database compatibility
        salary_df = salary_df.where(pd.notnull(salary_df), None)
        
        jobs_to_insert = []
        for _, row in salary_df.iterrows():
            remote_val = False
            if row["remote_allowed"] is not None:
                remote_val = bool(row["remote_allowed"] == 1.0 or row["remote_allowed"] is True)

            jobs_to_insert.append({
                "id": int(row["job_id"]),
                "title": row["title"],
                "company_name": row["company_name"],
                "description": row["description"],
                "location": row["location"],
                "work_type": row["formatted_work_type"],
                "experience_level": row["formatted_experience_level"],
                "remote_allowed": remote_val,
                "min_salary": float(row["min_salary"]) if row["min_salary"] is not None else None,
                "max_salary": float(row["max_salary"]) if row["max_salary"] is not None else None,
                "med_salary": float(row["med_salary"]) if row["med_salary"] is not None else None,
                "pay_period": row["pay_period"],
                "normalized_salary": float(row["normalized_salary"]) if row["normalized_salary"] is not None else None,
                "domain": row["domain"],
                "skills": row["skills_list"]
            })

        print(f"Bulk inserting {len(jobs_to_insert)} records into SQLite...")
        # Chunk insertion to prevent SQLite statement limits
        chunk_size = 5000
        for i in range(0, len(jobs_to_insert), chunk_size):
            chunk = jobs_to_insert[i:i+chunk_size]
            db.bulk_insert_mappings(Job, chunk)
            db.commit()
            print(f"Inserted records {i} to {min(i+chunk_size, len(jobs_to_insert))}")
            
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print("Error during database seeding:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
