import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

mongo_client = MongoClient(os.getenv("MULTI_AGENT_MONGODB_URI"))

db = mongo_client["multi_agent"]

conversations_collection = db["conversations"]
messages_collection = db["messages"]