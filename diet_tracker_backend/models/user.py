class User:
    def __init__(self, id, username, email, password):
        self.id = id              
        self.username = username  
        self.email = email        #  Added to match your database schema
        self.password = password  

    def to_dict(self):
        return {
            "id": self.id,            
            "username": self.username,
            "email": self.email       #  Safe to share with the frontend!
        }