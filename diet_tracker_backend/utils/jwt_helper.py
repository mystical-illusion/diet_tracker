import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "diet_secret")

def verify_token(request):
    token = request.headers.get("Authorization")
    
    if not token:
        return None
    
    try:
        token = token.split(" ")[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return data["user_id"]
    except:
        return None