import os

from expiringdict import ExpiringDict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.cloud import secretmanager

from icfpc2019 import app as icfpc2019

app = FastAPI()
cache = ExpiringDict(max_len=100, max_age_seconds=10)

def load_secret_token():
    token = cache.get("SECRET_TOKEN")
    if token:
        return token
    project_id = os.getenv("PROJECT_ID")
    secret_id = os.getenv("SECRET_ID")
    version_id = "latest"
    client = secretmanager.SecretManagerServiceClient()
    name = client.secret_version_path(project_id, secret_id, version_id)
    response = client.access_secret_version(name)
    token = response.payload.data.decode("UTF-8")
    cache["SECRET_TOKEN"] = token
    return token

@app.get("/api/v1/hello")
async def index():
    return {"message": "hello world!"}


@app.middleware("http")
async def auth_secret_token(request: Request, call_next):
    if os.getenv("PRODUCTION"):
        if request.headers.get("X-Negainoido-Secret") != load_secret_token():
            return JSONResponse(content={"error": "Unauthorized"}, status_code=401)
    return await call_next(request)


app.include_router(icfpc2019.router, prefix="/api/v1/icfpc2019", tags=["icfpc2019"])

if not os.getenv("PRODUCTION"):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
