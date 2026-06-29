from pymongo import MongoClient
from pymongo.server_api import ServerApi

MONGO_URI = "mongodb+srv://ashikinca:micfyv-rUfti5-kurgin@ashikin-website.iojfkhg.mongodb.net/?appName=ashikin-website"

client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
db = client["ashikin_website"]
users_collection = db["users"]

users_collection.create_index("email", unique=True)
