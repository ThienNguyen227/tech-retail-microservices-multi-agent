import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

mongo_client = MongoClient(os.getenv("MONGODB_URI"))

db = mongo_client["ai_service"]

conversations_collection = db["conversations"]
messages_collection = db["messages"]