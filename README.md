# Diet Tracker 🥗

A full-stack diet and metabolic analytics web application that helps users monitor daily nutritional intake, calculate personalized metabolic baselines using clinical formulas, and receive generative dietary optimizations powered by the Google Gemini API.

![Diet Tracker](https://img.shields.io/badge/Status-Active-brightgreen)
![Python](https://img.shields.io/badge/Python-3.x-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Flask](https://img.shields.io/badge/Flask-3.x-black)

---

## 🌟 Features

* 🔐 **Stateless JWT Security** — Secure user registration and login using PyJWT authentication and salted Bcrypt password hashing.
* 🧠 **Generative AI Personalization** — Integrated Google Gemini API to generate structured calorie, macronutrient (protein, carbs, fats), and hydration targets with contextual dietary rationales based on health profiles.
* 🧮 **Algorithmic Metabolic Engine** — Implemented the Mifflin-St Jeor equation in Python to accurately compute Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), and dynamic macronutrient distributions.
* 📊 **Multi-Window Analytics** — Visual trend tracking across rolling 7-day, 15-day, and 30-day historical windows.
* 📁 **Data Export Utilities** — Direct export of meal logs, nutritional summaries, and analytics in structured CSV and JSON formats.
* 🍎 **Food & Meal Logging** — Real-time tracking of meals, portion calories, and daily nutritional breakdowns.
* 🎯 **Goal Management** — Dynamic calorie and macro goal configuration synchronized in real time.
* 💧 **Hydration Tracking** — Monitor daily fluid and water intake against target levels.
* ⚡ **Decoupled Architecture & Zustand** — Modular Flask backend architecture communicating with a React 18 frontend powered by centralized Zustand state management.

---

## 🏗️ Project Structure

```text
diet-tracker/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env
│   │
│   ├── database/
│   │   └── database.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── meal_log.py
│   │   ├── daily_goal.py
│   │   ├── food_item.py
│   │   └── nutrition.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── food_service.py
│   │   ├── calorie_calc.py        # Mifflin-St Jeor metabolic engine
│   │   └── ai_service.py          # Google Gemini API integration
│   │
│   └── routes/
│       ├── auth_routes.py
│       ├── food_routes.py
│       ├── log_routes.py
│       ├── goal_routes.py
│       ├── user_routes.py
│       ├── nutrition_routes.py
│       ├── ai_routes.py
│       └── export_routes.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FoodLogPage.jsx
│   │   │   ├── NutritionPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── CalorieSummary.jsx
│   │   │   ├── FoodSearchBar.jsx
│   │   │   ├── GoalForm.jsx
│   │   │   ├── MealCard.jsx
│   │   │   ├── NutritionChart.jsx
│   │   │   ├── AnalyticsView.jsx
│   │   │   └── ProgressBar.jsx
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   ├── foodStore.js
│   │   │   ├── goalStore.js
│   │   │   └── logStore.js
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── foodService.js
│   │   │   ├── goalService.js
│   │   │   ├── logService.js
│   │   │   └── aiService.js
│   │   │
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
🛠️ Tech Stack
Backend
Technology	Purpose
Python 3.x	Programming language
Flask	Web framework
SQLite	Database
Google Gemini API	AI-powered diet recommendations & rationales
PyJWT	JWT token generation & stateless auth
bcrypt	Password hashing
Flask-CORS	Cross-origin requests
python-dotenv	Environment variables
Frontend
Technology	Purpose
React 18	UI library
Vite	Build tool
React Router	Navigation
Zustand	State management
Axios	HTTP requests
date-fns	Date formatting
react-hot-toast	Notifications
🚀 Getting Started
Prerequisites
Python 3.x

Node.js 18+

npm

Google Gemini API Key

Backend Setup
Bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate   # Windows
source .venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "SECRET_KEY=your_secret_key_here" > .env
echo "DATABASE=diet_tracker.db" >> .env
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env

# Run server
python app.py
Server runs at: [http://127.0.0.1:5001](http://127.0.0.1:5001)

Frontend Setup
Bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
App runs at: http://localhost:5173

📡 API Endpoints
Authentication
Method	Endpoint	Description	Auth Required
POST	/auth/register	Register new user	No
POST	/auth/login	Login & get JWT token	No
Food & Meals
Method	Endpoint	Description	Auth Required
GET	/food/list	Get all logged meals	Yes
POST	/food/add	Add new meal entry	Yes
PUT	/food/<id>	Update existing meal	Yes
DELETE	/food/<id>	Delete meal entry	Yes
Daily Logs & Analytics
Method	Endpoint	Description	Auth Required
GET	/logs/daily	Get daily meal summary and calories	Yes
GET	/logs/analytics	Fetch 7/15/30-day intake trends	Yes
GET	/logs/export	Export intake logs (CSV/JSON)	Yes
Metabolic Engine & AI
Method	Endpoint	Description	Auth Required
GET	/nutrition/metabolic	Compute BMR & TDEE via Mifflin-St Jeor	Yes
POST	/ai/recommendations	Get Gemini API macro goals & rationale	Yes
Goals & Profile
Method	Endpoint	Description	Auth Required
GET	/goals/<user_id>	Get current user goals	Yes
POST	/goals/	Set/update calorie and macro goals	Yes
GET	/users/<id>	Get user profile	Yes
PUT	/users/<id>	Update username/profile	Yes
Nutrition
Method	Endpoint	Description	Auth Required
GET	/nutrition/<food_name>	Get nutrition info	No
GET	/nutrition/list	Get all reference foods	No
🔑 Example API Usage
Register
HTTP
POST /auth/register
Content-Type: application/json

{
    "username": "maya",
    "email": "maya@gmail.com",
    "password": "securepassword"
}
Login
HTTP
POST /auth/login
Content-Type: application/json

{
    "email": "maya@gmail.com",
    "password": "securepassword"
}
Response:

JSON
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "maya",
        "email": "maya@gmail.com"
    }
}
Add Meal
HTTP
POST /food/add
Authorization: Bearer <token>
Content-Type: application/json

{
    "user_id": 1,
    "food": "banana",
    "calories": 89
}
AI Nutrition Recommendation
HTTP
POST /ai/recommendations
Authorization: Bearer <token>
Content-Type: application/json

{
    "age": 22,
    "gender": "female",
    "weight_kg": 55,
    "height_cm": 165,
    "activity_level": "moderate",
    "goal": "maintenance"
}
Response:

JSON
{
    "bmr": 1320,
    "tdee": 2046,
    "target_calories": 2046,
    "macros": {
        "protein_g": 110,
        "carbs_g": 240,
        "fat_g": 60
    },
    "water_liters": 2.5,
    "rationale": "Caloric baseline matches your current TDEE to maintain weight, with protein optimized at 2.0g/kg to support lean muscle preservation."
}
🗄️ Database Schema
SQL
-- Users table
CREATE TABLE users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT    NOT NULL,
    email    TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL
);

-- Meals table
CREATE TABLE meals (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL,
    food     TEXT    NOT NULL,
    calories INTEGER NOT NULL,
    date     TEXT    DEFAULT CURRENT_DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Goals table
CREATE TABLE goals (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL UNIQUE,
    daily_goal INTEGER NOT NULL,
    protein_g  INTEGER DEFAULT 0,
    carbs_g    INTEGER DEFAULT 0,
    fat_g      INTEGER DEFAULT 0,
    water_ml   INTEGER DEFAULT 2000,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
🏛️ Architecture
Plaintext
┌────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                 │
│           Zustand Store  •  Axios Interceptors         │
└──────────────────────────┬─────────────────────────────┘
                           │
             HTTP Requests │ Bearer JWT in Header
                           ▼
┌────────────────────────────────────────────────────────┐
│                     Backend (Flask)                    │
│   ├── Routes Layer   → Handle HTTP requests            │
│   ├── Services Layer → Mifflin-St Jeor & Gemini AI     │
│   └── Models Layer   → Data representation & queries   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Database (SQLite)                    │
│         Relational storage with Foreign Keys           │
└────────────────────────────────────────────────────────┘
👥 Team
Name	Role	GitHub
Maya Kumari	Backend Development & AI Integration	@mystical-illusion
Ruby Lal	Frontend Development	—
Institution: Birla Institute of Technology (BIT), Mesra

📚 Learning Journey
This project was built as part of learning:

REST API design and modular architecture in Flask

Stateless JWT authentication and password hashing with bcrypt

Client-side global state synchronization using Zustand

AI service integration with Google Gemini API

Clinical nutrition calculation algorithms (Mifflin-St Jeor)

Relational schema design with foreign key constraints in SQLite

🔮 Future Scope
Planned Features:

[ ] Automated food logging via image recognition

[ ] Weekly/Monthly PDF report generation

[ ] Recipe database with automatic micronutrient aggregation

[ ] Mobile app build using React Native

[ ] Cloud deployment with PostgreSQL on AWS/GCP

📄 License
This project is open-source and intended for educational purposes.

⭐ Star this repository if you found it helpful!
