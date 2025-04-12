from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from main import text_identification, localize_objects

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload/image")
async def upload_photo(file: UploadFile = File(...)):
    # Save the uploaded file to disk
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process the file
    text_bounding_boxes = text_identification(file_path)
    building_bounding_boxes = localize_objects(file_path)

    return {
        "text_bounding_boxes": text_bounding_boxes,
        "building_bounding_boxes": building_bounding_boxes,
    }
