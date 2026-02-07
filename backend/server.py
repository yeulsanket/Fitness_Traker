from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Helper function to serialize ObjectId
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Models
class ExerciseSet(BaseModel):
    reps: int
    weight: float
    completed: bool = True

class Exercise(BaseModel):
    name: str
    category: str
    sets: List[ExerciseSet]

class WorkoutCreate(BaseModel):
    date: str
    exercises: List[Exercise]
    duration: Optional[int] = None  # in minutes
    notes: Optional[str] = None

class Workout(BaseModel):
    id: str = Field(alias="_id")
    date: str
    exercises: List[Exercise]
    duration: Optional[int] = None
    notes: Optional[str] = None
    created_at: str

    class Config:
        populate_by_name = True

class StepLog(BaseModel):
    date: str
    steps: int

class WorkoutStats(BaseModel):
    total_workouts: int
    total_duration: int
    workouts_this_week: int
    workouts_this_month: int
    total_steps_today: int

# Exercise templates
EXERCISE_LIBRARY = [
    {"name": "Bench Press", "category": "Chest"},
    {"name": "Push Ups", "category": "Chest"},
    {"name": "Incline Dumbbell Press", "category": "Chest"},
    {"name": "Squats", "category": "Legs"},
    {"name": "Leg Press", "category": "Legs"},
    {"name": "Lunges", "category": "Legs"},
    {"name": "Deadlifts", "category": "Back"},
    {"name": "Pull Ups", "category": "Back"},
    {"name": "Bent Over Rows", "category": "Back"},
    {"name": "Overhead Press", "category": "Shoulders"},
    {"name": "Lateral Raises", "category": "Shoulders"},
    {"name": "Front Raises", "category": "Shoulders"},
    {"name": "Bicep Curls", "category": "Arms"},
    {"name": "Tricep Dips", "category": "Arms"},
    {"name": "Hammer Curls", "category": "Arms"},
    {"name": "Planks", "category": "Core"},
    {"name": "Crunches", "category": "Core"},
    {"name": "Russian Twists", "category": "Core"},
]

# Routes
@api_router.get("/")
async def root():
    return {"message": "Fitness Tracking API"}

# Workout endpoints
@api_router.post("/workouts")
async def create_workout(workout: WorkoutCreate):
    workout_dict = workout.model_dump()
    workout_dict['created_at'] = datetime.utcnow().isoformat()
    result = await db.workouts.insert_one(workout_dict)
    workout_dict['_id'] = str(result.inserted_id)
    return serialize_doc(workout_dict)

@api_router.get("/workouts")
async def get_workouts(start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if start_date and end_date:
        query['date'] = {'$gte': start_date, '$lte': end_date}
    
    workouts = await db.workouts.find(query).sort('date', -1).to_list(100)
    return [serialize_doc(w) for w in workouts]

@api_router.get("/workouts/{workout_id}")
async def get_workout(workout_id: str):
    try:
        workout = await db.workouts.find_one({'_id': ObjectId(workout_id)})
        if not workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        return serialize_doc(workout)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/workouts/{workout_id}")
async def update_workout(workout_id: str, workout: WorkoutCreate):
    try:
        workout_dict = workout.model_dump()
        result = await db.workouts.update_one(
            {'_id': ObjectId(workout_id)},
            {'$set': workout_dict}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        updated_workout = await db.workouts.find_one({'_id': ObjectId(workout_id)})
        return serialize_doc(updated_workout)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/workouts/{workout_id}")
async def delete_workout(workout_id: str):
    try:
        result = await db.workouts.delete_one({'_id': ObjectId(workout_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Workout not found")
        return {"message": "Workout deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Stats endpoint
@api_router.get("/workouts/stats/summary")
async def get_workout_stats():
    from datetime import timedelta
    
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Total workouts
    total_workouts = await db.workouts.count_documents({})
    
    # Workouts this week
    workouts_this_week = await db.workouts.count_documents({
        'date': {'$gte': week_ago.isoformat()}
    })
    
    # Workouts this month
    workouts_this_month = await db.workouts.count_documents({
        'date': {'$gte': month_ago.isoformat()}
    })
    
    # Total duration
    workouts = await db.workouts.find({'duration': {'$exists': True}}).to_list(1000)
    total_duration = sum(w.get('duration', 0) for w in workouts)
    
    # Steps today
    step_log = await db.steps.find_one({'date': today.isoformat()})
    total_steps_today = step_log.get('steps', 0) if step_log else 0
    
    return {
        'total_workouts': total_workouts,
        'total_duration': total_duration,
        'workouts_this_week': workouts_this_week,
        'workouts_this_month': workouts_this_month,
        'total_steps_today': total_steps_today
    }

# Exercise library
@api_router.get("/exercises")
async def get_exercises():
    return EXERCISE_LIBRARY

# Step tracking
@api_router.post("/steps")
async def log_steps(step_log: StepLog):
    result = await db.steps.update_one(
        {'date': step_log.date},
        {'$set': {'steps': step_log.steps}},
        upsert=True
    )
    return {"message": "Steps logged successfully", "steps": step_log.steps}

@api_router.get("/steps")
async def get_steps(start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if start_date and end_date:
        query['date'] = {'$gte': start_date, '$lte': end_date}
    
    steps = await db.steps.find(query).sort('date', -1).to_list(100)
    return [serialize_doc(s) for s in steps]

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()