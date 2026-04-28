from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .db.connection import connect_db, disconnect_db, get_db
from .db.indexes import create_indexes
from .routers import auth, profile, symptoms, scanner, diet, vitals, exercise, brief, sessions, lab_report, wellness, skin, xray, herbs


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await connect_db(settings.mongodb_uri, settings.mongodb_db_name)
    db = await get_db()
    await create_indexes(db)
    yield
    await disconnect_db()


app = FastAPI(
    title='Praana API',
    description="India's Intelligent Health Companion",
    version='1.0.0',
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix='/api/auth', tags=['auth'])
app.include_router(profile.router, prefix='/api/profile', tags=['profile'])
app.include_router(symptoms.router, prefix='/api/symptoms', tags=['symptoms'])
app.include_router(scanner.router, prefix='/api/scanner', tags=['scanner'])
app.include_router(diet.router, prefix='/api/diet', tags=['diet'])
app.include_router(vitals.router, prefix='/api/vitals', tags=['vitals'])
app.include_router(exercise.router, prefix='/api/exercise', tags=['exercise'])
app.include_router(brief.router, prefix='/api/brief', tags=['brief'])
app.include_router(sessions.router, prefix='/api/symptoms', tags=['symptoms'])
app.include_router(lab_report.router, prefix='/api/lab-report', tags=['lab-report'])
app.include_router(wellness.router, prefix='/api/wellness', tags=['wellness'])
app.include_router(skin.router, prefix='/api/skin', tags=['skin'])
app.include_router(xray.router, prefix='/api/xray', tags=['xray'])
app.include_router(herbs.router, prefix='/api/herbs', tags=['herbs'])


@app.get('/health')
async def health_check():
    return {'status': 'ok', 'version': '1.0.0'}
