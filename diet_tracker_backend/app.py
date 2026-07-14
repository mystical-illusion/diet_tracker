from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database.database import init_db
from routes.auth_routes import auth_bp
from routes.food_routes import food_bp
from routes.log_routes import log_bp
from routes.goal_routes import goal_bp
from routes.user_routes import user_bp
from routes.nutrition_routes import nutrition_bp
#from routes.ai_recommend import ai_bp


app = Flask(__name__)


CORS(app, origins=["http://localhost:5173"])
app.config.from_object(Config)
CORS(app)

# register all blueprints
# app.register_blueprint(ai_bp, url_prefix="/ai")
app.register_blueprint(auth_bp,      url_prefix="/auth")
app.register_blueprint(food_bp,      url_prefix="/food")
app.register_blueprint(log_bp,       url_prefix="/logs")
app.register_blueprint(goal_bp,      url_prefix="/goals")
app.register_blueprint(user_bp,      url_prefix="/users")
app.register_blueprint(nutrition_bp, url_prefix="/nutrition")

@app.route("/")
def home():
    return jsonify({
        "message": "Diet Tracker API is running!",
        "version": "1.0"
    }), 200

if __name__ == "__main__":
    init_db()
    # Explicitly set the port to 5001 to bypass OS conflicts
    app.run(host="127.0.0.1", port=5001, debug=True)










    