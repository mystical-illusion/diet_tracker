from functools import wraps
from flask import jsonify, request
from utils.jwt_helper import verify_token

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = verify_token(request)
        if not user_id:
            return jsonify({"error": "token required"}), 401
        return f(*args, **kwargs)
    return decorated