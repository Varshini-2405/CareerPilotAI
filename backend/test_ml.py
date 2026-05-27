import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add parent directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app

class TestMLEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_resume_analysis_text_file(self):
        # Create mock resume text content
        resume_text = """
        John Doe
        Software Engineer
        
        Experience:
        - Developed web applications using Python, JavaScript, React, and Node.js.
        - Managed database schemas on PostgreSQL and MySQL.
        - Designed and deployed containers using Docker and Git version control.
        - Cloud experience with AWS.
        """
        
        # Call the endpoint with Form data and File upload
        response = self.client.post(
            "/api/ml/resume-analysis",
            data={"target_job": "Software Engineer"},
            files={"file": ("resume.txt", resume_text.encode("utf-8"), "text/plain")}
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["filename"], "resume.txt")
        self.assertEqual(data["target_job"], "Software Engineer")
        self.assertEqual(data["inferred_domain"], "Software")
        self.assertIn("score", data)
        self.assertTrue(isinstance(data["score"], int))
        
        # Check that expected skills from our resume text were extracted
        extracted = [s.lower() for s in data["extracted_skills"]]
        self.assertIn("python", extracted)
        self.assertIn("react", extracted)
        self.assertIn("docker", extracted)
        self.assertIn("aws", extracted)
        
        # Verify other required keys
        self.assertIn("matched_skills", data)
        self.assertIn("missing_skills", data)
        self.assertIn("recommendations", data)
        self.assertTrue(len(data["recommendations"]) > 0)

    def test_career_recommendation(self):
        # Call the endpoint with Form data
        response = self.client.post(
            "/api/ml/career-recommendation",
            data={
                "skills": "Python, SQL, HTML",
                "interest": "AI/ML",
                "experience_years": "2.5"
            }
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["target_interest"], "AI/ML")
        self.assertEqual(data["experience_years"], 2.5)
        self.assertIn("Python", data["input_skills"])
        self.assertIn("SQL", data["input_skills"])
        
        # Verify roles, certifications, projects, missing skills, salary
        self.assertIn("recommended_roles", data)
        self.assertTrue(len(data["recommended_roles"]) > 0)
        
        self.assertIn("certifications", data)
        self.assertTrue(len(data["certifications"]) > 0)
        
        self.assertIn("recommended_projects", data)
        self.assertTrue(len(data["recommended_projects"]) > 0)
        
        self.assertIn("missing_skills", data)
        self.assertIn("estimated_target_salary", data)
        self.assertTrue(data["estimated_target_salary"] > 0)
        self.assertEqual(data["market_demand"], "High")

if __name__ == "__main__":
    unittest.main()
