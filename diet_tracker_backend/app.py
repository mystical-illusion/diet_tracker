from flask import Flask, request, make_response
from flask_cors import CORS
from database.database import init_db

# Import all blueprints
from routes.auth_routes import auth_bp
from routes.food_routes import food_bp
from routes.nutrition_routes import nutrition_bp
from routes.analytics_routes import analytics_bp
from routes.goal_routes import goal_bp
from routes.user_routes import user_bp

from routes.log_routes import log_bp  # or wherever daily logs are registered



app = Flask(__name__)

# Initialize CORS
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Universal Preflight & CORS Header Injector
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Access-Control-Allow-Headers, Origin, Accept, X-Requested-With"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    return response

# Global Handler for any OPTIONS request that hits an unregistered method
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_preflight_handler(path):
    response = make_response()
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Access-Control-Allow-Headers, Origin, Accept, X-Requested-With"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    return response, 200

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(food_bp, url_prefix="/food")
app.register_blueprint(nutrition_bp, url_prefix="/nutrition")
app.register_blueprint(analytics_bp, url_prefix="/analytics")
app.register_blueprint(goal_bp, url_prefix="/goals")
app.register_blueprint(user_bp, url_prefix="/user")

app.register_blueprint(log_bp)


if __name__ == "__main__":
    init_db()
    print("🚀 Flask backend running on http://127.0.0.1:5001")
    app.run(host="127.0.0.1", port=5001, debug=True)