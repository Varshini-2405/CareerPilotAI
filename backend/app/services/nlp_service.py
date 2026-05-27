import io
import re
import spacy
import pypdf
from typing import List, Dict

# Load the spaCy English model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback if model is not loaded correctly
    nlp = None

# Comprehensive Multi-Domain Skill Dictionary
SKILL_DICTIONARY: Dict[str, List[str]] = {
    "AI/ML": [
        "Python", "R", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", 
        "Scikit-Learn", "NumPy", "Pandas", "NLP", "Natural Language Processing", 
        "Computer Vision", "Keras", "SQL", "Spark", "MLOps", "Hugging Face", "LLM", 
        "Data Science", "Statistics", "Neural Networks", "Reinforcement Learning",
        "OpenCV", "Matplotlib", "Seaborn", "XGBoost", "SciPy"
    ],
    "Cloud": [
        "AWS", "Azure", "GCP", "DevOps", "Kubernetes", "Docker", "Terraform", 
        "Ansible", "Jenkins", "CI/CD", "Linux", "Bash", "SRE", "Site Reliability", 
        "Prometheus", "Grafana", "Nginx", "Git", "CloudFormation", "YAML", "Serverless"
    ],
    "Cybersecurity": [
        "Security", "Cybersecurity", "Firewall", "Penetration Testing", "Wireshark", 
        "Vulnerability", "OWASP", "SIEM", "SOC", "Cryptography", "Network Security", 
        "Ethical Hacking", "Metasploit", "CISSP", "CompTIA", "Linux", "IDS/IPS", 
        "Nmap", "Burp Suite", "Active Directory", "Incident Response"
    ],
    "Software": [
        "JavaScript", "TypeScript", "React", "Node.js", "HTML", "CSS", "Python", 
        "Java", "C++", "C#", "Rust", "Go", "Golang", "Ruby", "PHP", "SQL", "NoSQL", 
        "MongoDB", "PostgreSQL", "MySQL", "Git", "REST API", "GraphQL", "Docker", 
        "Linux", "Sass", "Webpack", "Vue", "Angular", "Express", "Spring Boot", 
        "Flask", "FastAPI", "Django"
    ],
    "Finance": [
        "Accounting", "Financial Analysis", "Excel", "Valuation", "Financial Modeling", 
        "Tax", "Audit", "SAP", "QuickBooks", "Banking", "Portfolio Management", 
        "Risk Management", "CFA", "CPA", "Forecasting", "Equity Research", 
        "Corporate Finance", "Bookkeeping", "General Ledger"
    ],
    "Marketing": [
        "SEO", "SEM", "Digital Marketing", "Google Analytics", "Social Media", 
        "Content Strategy", "Copywriting", "Email Marketing", "HubSpot", "Mailchimp", 
        "AdWords", "Brand Management", "Public Relations", "Google Ads", "Content Marketing",
        "A/B Testing", "Market Research"
    ],
    "HR": [
        "Recruiting", "Talent Acquisition", "Payroll", "Onboarding", "Employee Relations", 
        "ATS", "HRIS", "Workday", "Conflict Resolution", "HR Laws", "Performance Management",
        "Interviewing", "Sourcing", "HR Policies"
    ],
    "Mechanical": [
        "CAD", "SolidWorks", "AutoCAD", "Ansys", "Matlab", "Thermodynamics", 
        "Manufacturing", "Product Design", "GD&T", "HVAC", "Robotics", 
        "Finite Element Analysis", "FEA", "Fluid Dynamics", "Materials Science"
    ],
    "Civil": [
        "AutoCAD", "Civil 3D", "Structural Analysis", "Revit", "GIS", "Surveying", 
        "Construction Management", "Project Management", "Concrete", "Geotechnical", 
        "Estimations", "SAP2000", "STAAD Pro", "Steel Design"
    ],
    "Electronics": [
        "PCB Design", "Circuit Design", "Altium", "Embedded Systems", "Microcontrollers", 
        "Arduino", "Raspberry Pi", "FPGA", "VHDL", "Verilog", "Oscilloscope", 
        "Firmware", "C", "Assembly", "Multisim", "Eagle CAD", "Hardware Design"
    ]
}

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts raw text from PDF file bytes using pypdf."""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        print("Error parsing PDF resume:", e)
        return ""

def clean_text(t: str) -> str:
    """Helper to normalize text by replacing symbols (except + and #) with spaces and adding padding."""
    cleaned = re.sub(r'[^a-zA-Z0-9+#\s]', ' ', t.lower())
    return " " + " ".join(cleaned.split()) + " "

def extract_skills_from_text(text: str) -> List[str]:
    """Matches text against predefined skill keywords using fast boundary normalization."""
    if not text:
        return []
    
    text_processed = clean_text(text)
    extracted_skills = set()
    
    # Search for occurrences of each skill in the dictionary
    for domain, skill_list in SKILL_DICTIONARY.items():
        for skill in skill_list:
            skill_cleaned = clean_text(skill).strip()
            # Enforce clean word boundaries by wrapping in spaces
            if f" {skill_cleaned} " in text_processed:
                extracted_skills.add(skill)
                
    return sorted(list(extracted_skills))
