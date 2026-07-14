# tests/test_routes.py
import unittest
from app import app

class TestRoutes(unittest.TestCase):
    
    def setUp(self):
        self.client = app.test_client()
    
    def test_home(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
    
    def test_register(self):
        response = self.client.post("/auth/register", json={
            "username": "test",
            "password": "1234"
        })
        self.assertEqual(response.status_code, 201)