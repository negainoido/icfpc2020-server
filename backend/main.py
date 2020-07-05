import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from icfpc2019 import app as icfpc2019

app = FastAPI()


@app.get("/api/v1/hello")
async def index():
    return {"message": "hello world!"}


@app.middleware("http")
async def auth_secret_token(request: Request, call_next):
    if os.getenv("PRODUCTION"):
        if request.headers.get("X-Negainoido-Secret") != os.getenv("SECRET_TOKEN"):
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
