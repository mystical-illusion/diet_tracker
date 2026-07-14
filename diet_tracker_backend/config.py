import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "diet_secret")
    DATABASE   = os.getenv("DATABASE", "diet_tracker.db")
    DEBUG      = True





