from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db

# Import routers
from app.routes.jobs import router as jobs_router
from app.routes.analytics import router as analytics_router
from app.routes.salaries import router as salaries_router
from app.routes.ml import router as ml_router

app = FastAPI(
    title="CareerPilot AI API",
    description="AI-powered Multi-Domain Career Intelligence Platform Backend",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(jobs_router)
app.include_router(analytics_router)
app.include_router(salaries_router)
app.include_router(ml_router)

@app.on_event("startup")
def on_startup():
    # Automatically initialize SQLite database tables
    init_db()

@app.get("/")
def read_root():
    return {
        "message": "Welcome to CareerPilot AI API!",
        "status": "online",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
