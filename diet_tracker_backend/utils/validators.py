def validate_register_data(data):
    if not data:
        return "no data sent"
    if "username" not in data:
        return "username is required"
    if "password" not in data:
        return "password is required"
    return None  # no error!

def validate_food_data(data):
    if not data:
        return "no data sent"
    if "food" not in data:
        return "food is required"
    if "calories" not in data:
        return "calories is required"
    return None