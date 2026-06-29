from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime
from pymongo.errors import DuplicateKeyError
from bson import ObjectId

from database import users_collection
from auth import hash_password, verify_password, create_token, decode_token

app = FastAPI()
bearer = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": str(user["_id"]), "email": user["email"], "created_at": user["created_at"]}

@app.post("/auth/signup")
def signup(body: SignupRequest):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    pw_hash = hash_password(body.password)
    try:
        result = users_collection.insert_one({
            "email": body.email,
            "password_hash": pw_hash,
            "created_at": datetime.utcnow().isoformat()
        })
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Email already registered")
    token = create_token(str(result.inserted_id))
    return {"token": token, "email": body.email}

@app.post("/auth/login")
def login(body: LoginRequest):
    user = users_collection.find_one({"email": body.email})
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(str(user["_id"]))
    return {"token": token, "email": user["email"]}

@app.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    return current_user

@app.get("/dashboard")
def dashboard(current_user=Depends(get_current_user)):
    return {"message": f"Welcome back, {current_user['email']}!", "user": current_user}
