from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()  # must run before os.getenv() calls in services

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import events, nomad
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Urban Nomad API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-Admin-Token"],
)

app.include_router(events.router, prefix="/api")
app.include_router(nomad.router, prefix="/api/nomad")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "urban-nomad-api"}
