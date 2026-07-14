# Diet Tracker 🥗

A full-stack diet tracking web application that helps users monitor their daily food intake, track calories, and achieve nutrition goals.

![Diet Tracker](https://img.shields.io/badge/Status-Active-brightgreen)
![Python](https://img.shields.io/badge/Python-3.x-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Flask](https://img.shields.io/badge/Flask-3.x-black)

---

## 🌟 Features

- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing
- 🍎 **Food Logging** — Track daily meals with calories
- 🎯 **Goal Management** — Set and track daily calorie goals
- 📊 **Nutrition Info** — Get nutrition data for common foods
- 📅 **Daily Logs** — View meals by date
- 👤 **User Profiles** — Manage your account
- 💧 **Hydration Tracking** — Monitor daily water intake
- 📈 **7-Day Charts** — Visual calorie history

---

## 🏗️ Project Structure




diet-tracker/
│
├── backend/                    # Python Flask REST API
│   ├── app.py                  # Main application entry point
│   ├── config.py               # Configuration settings
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables
│   │
│   ├── database/
│   │   └── database.py         # SQLite connection & setup
│   │
│   ├── models/                 # OOP Data models
│   │   ├── user.py
│   │   ├── meal_log.py
│   │   ├── daily_goal.py
│   │   ├── food_item.py
│   │   └── nutrition.py
│   │
│   ├── services/               # Business logic layer
│   │   ├── auth_service.py
│   │   ├── food_service.py
│   │   └── calorie_calc.py
│   │
│   └── routes/                 # API endpoints
│       ├── auth_routes.py
│       ├── food_routes.py
│       ├── log_routes.py
│       ├── goal_routes.py
│       ├── user_routes.py
│       └── nutrition_routes.py
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # Full page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FoodLogPage.jsx
│   │   │   ├── NutritionPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   ├── components/         # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── CalorieSummary.jsx
│   │   │   ├── FoodSearchBar.jsx
│   │   │   ├── GoalForm.jsx
│   │   │   ├── MealCard.jsx
│   │   │   ├── NutritionChart.jsx
│   │   │   └── ProgressBar.jsx
│   │   │
│   │   ├── store/              # Zustand state management
│   │   │   ├── authStore.js
│   │   │   ├── foodStore.js
│   │   │   ├── goalStore.js
│   │   │   └── logStore.js
│   │   │
│   │   ├── services/           # API service layer
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── foodService.js
│   │   │   ├── goalService.js
│   │   │   └── logService.js
│   │   │
│   │   ├── App.jsx             # AppLayout with Navbar
│   │   ├── router.jsx          # React Router config
│   │   └── main.jsx            # Entry point
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.x | Programming language |
| Flask | Web framework |
| SQLite | Database |
| PyJWT | JWT token generation |
| bcrypt | Password hashing |
| Flask-CORS | Cross-origin requests |
| python-dotenv | Environment variables |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| Vite | Build tool |
| React Router | Navigation |
| Zustand | State management |
| Axios | HTTP requests |
| date-fns | Date formatting |
| react-hot-toast | Notifications |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.x
- Node.js 18+
- npm

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "SECRET_KEY=your_secret_key_here" > .env
echo "DATABASE=diet_tracker.db" >> .env

# Run server
python app.py
```

Server runs at: `http://127.0.0.1:5001`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

App runs at: `http://localhost:5173`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login & get JWT token | No |

### Food/Meals
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/food/list` | Get all meals | Yes |
| POST | `/food/add` | Add new meal | Yes |
| PUT | `/food/<id>` | Update meal | Yes |
| DELETE | `/food/<id>` | Delete meal | Yes |

### Daily Logs
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/logs/daily` | Get daily meal summary | Yes |

### Goals
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/goals/<user_id>` | Get user goal | Yes |
| POST | `/goals/` | Set/update goal | Yes |

### Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/<id>` | Get user profile | Yes |
| PUT | `/users/<id>` | Update username | Yes |

### Nutrition
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/nutrition/<food_name>` | Get nutrition info | No |
| GET | `/nutrition/list` | Get all foods | No |

---

## 🔑 Example API Usage

### Register
```json
POST /auth/register
{
    "username": "maya",
    "email": "maya@gmail.com",
    "password": "securepassword"
}
```

### Login
```json
POST /auth/login
{
    "email": "maya@gmail.com",
    "password": "securepassword"
}
```

Response:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "maya",
        "email": "maya@gmail.com"
    }
}
```

### Add Meal
```json
POST /food/add
Authorization: Bearer <token>
{
    "user_id": 1,
    "food": "banana",
    "calories": 89
}
```

---

## 🗄️ Database Schema

```sql
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
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Goals table
CREATE TABLE goals (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL UNIQUE,
    daily_goal INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🏛️ Architecture
Frontend (React)
│
│ HTTP Requests (Axios/fetch)
│ JWT Token in Headers
▼
Backend (Flask)
│
├── Routes Layer    → Handle HTTP requests
├── Services Layer  → Business logic
├── Models Layer    → Data representation
│
▼
Database (SQLite)

---

## 👥 Team

| Name | Role | GitHub |
|------|------|--------|
| Maya Kumari | Backend Development | [@mystical-illusion](https://github.com/mystical-illusion) |
| Ruby Lal | Frontend Development | - |

**Institution:** Birla Institute of Technology (BIT), Mesra

---

## 📚 Learning Journey

This project was built as part of learning:
- REST API design and development
- JWT Authentication
- Full-stack web development
- React state management with Zustand
- Blueprint architecture in Flask
- Database design with SQLite

---

## 🔮 Future Scope
Planned Features:
├── AI-powered meal suggestions
├── Macro tracking (protein, carbs, fat)
├── Weekly nutrition reports
├── Recipe database
├── Mobile app (React Native)
└── Deployment on cloud (AWS/GCP)

---

## 📄 License

This project is for educational purposes.

---

⭐ Star this repository if you found it helpful!
