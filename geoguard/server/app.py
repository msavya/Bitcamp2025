from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # Import StaticFiles for serving static files
from typing import List
import shutil
import os
import cv2
import uuid
import numpy as np
from main import blur_combined_elements
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

# Mount the 'uploads' directory as a static file path
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/blur-region/")
async def blur_region(
    file: UploadFile = File(...),
    vertices: List[float] = Form(...),
):
    if len(vertices) != 8:
        return {"error": "Exactly 8 coordinates (x1, y1, ..., x4, y4) required."}

    # Save file locally
    image_filename = f"{uuid.uuid4()}.jpg"
    image_path = os.path.join(UPLOAD_DIR, image_filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process vertices
    paired_vertices = [(vertices[i], vertices[i+1]) for i in range(0, 8, 2)]

    # Generate blurred image
    blurred_filename = f"blurred_{image_filename}"
    output_path = os.path.join(UPLOAD_DIR, blurred_filename)
    blur_combined_elements(image_path, output_path, [{
        "vertices": paired_vertices,
        "normalized": True
    }])

    # Run detections
    text_boxes = text_identification(output_path)
    building_boxes = localize_objects(output_path)

    print(len(building_boxes))

    # Return JSON response with correct URL
    return {
        "success": True,
        "blurred_image_url": f"/uploads/{blurred_filename}",  # Correct URL format
        "detections": {
            "text": text_boxes,
            "buildings": building_boxes
        }
    }

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
