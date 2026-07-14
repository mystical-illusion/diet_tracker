# Diet Tracker API 🥗

A complete REST API for tracking daily food intake, calories, and nutrition goals built with Flask.

## Features

- 🔐 JWT Authentication (Register/Login)
- 🍎 Food logging with calorie tracking
- 🎯 Daily calorie goal management
- 📊 Nutrition information lookup
- 📅 Daily meal logs with date filtering
- 👤 User profile management

## Tech Stack

- **Backend:** Python, Flask
- **Database:** SQLite
- **Authentication:** JWT (PyJWT), bcrypt
- **Architecture:** Blueprint pattern with Models, Services, Routes separation

## Project Structure

diet_tracker/

├── app.py # Main application entry point

├── config.py # Configuration settings

├── database/

│ └── database.py # Database connection & setup

├── models/ # Data models (OOP classes)

│ ├── user.py

│ ├── meal_log.py

│ ├── daily_goal.py

│ ├── food_item.py

│ └── nutrition.py

├── services/ # Business logic layer

│ ├── auth_service.py

│ ├── food_service.py

│ └── calorie_calc.py

└── routes/ # API endpoints

├── auth_routes.py

├── food_routes.py

├── log_routes.py

├── goal_routes.py

├── user_routes.py

└── nutrition_routes.py

## Installation

```bash
# Clone repository
git clone https://github.com/your-username/diet-tracker.git
cd diet-tracker

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "SECRET_KEY=your_secret_key" > .env
echo "DATABASE=diet_tracker.db" >> .env

# Run the application
python app.py
```

## API Endpoints

### Authentication

| Method | Endpoint         | Description             |
| ------ | ---------------- | ----------------------- |
| POST   | `/auth/register` | Register new user       |
| POST   | `/auth/login`    | Login and get JWT token |

### Food/Meals

| Method | Endpoint     | Description    |
| ------ | ------------ | -------------- |
| POST   | `/food/add`  | Add a new meal |
| GET    | `/food/list` | Get all meals  |
| PUT    | `/food/<id>` | Update a meal  |
| DELETE | `/food/<id>` | Delete a meal  |

### Daily Logs

| Method | Endpoint                                | Description            |
| ------ | --------------------------------------- | ---------------------- |
| GET    | `/logs/daily?user_id=1&date=2026-06-20` | Get daily meal summary |

### Goals

| Method | Endpoint           | Description           |
| ------ | ------------------ | --------------------- |
| GET    | `/goals/<user_id>` | Get user's daily goal |
| POST   | `/goals/`          | Set/update daily goal |

### Users

| Method | Endpoint      | Description      |
| ------ | ------------- | ---------------- |
| GET    | `/users/<id>` | Get user profile |
| PUT    | `/users/<id>` | Update username  |

### Nutrition

| Method | Endpoint                 | Description                 |
| ------ | ------------------------ | --------------------------- |
| GET    | `/nutrition/<food_name>` | Get nutrition info          |
| GET    | `/nutrition/list`        | Get all food nutrition data |

## Example Usage

**Register:**

```json
POST /auth/register
{
  "username": "maya",
  "password": "1234"
}
```

**Login:**

```json
POST /auth/login
{
  "username": "maya",
  "password": "1234"
}
```

**Add Meal:**

```json
POST /food/add
{
  "user_id": 1,
  "food": "banana",
  "calories": 89
}
```

## Author

**Maya Kumari**  
Birla Institute of Technology, Mesra  
[GitHub](https://github.com/mystical-illusion)
