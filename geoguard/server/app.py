from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
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

@app.post("/blur-region/")
async def blur_region(
    file: UploadFile = File(...),
    vertices: List[float] = Form(...)
):
    if len(vertices) != 8:
        return {"error": "Exactly 8 coordinates (x1, y1, ..., x4, y4) required."}

    # Save file locally
    image_filename = f"{uuid.uuid4()}.jpg"
    image_path = os.path.join(UPLOAD_DIR, image_filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Convert list to [(x1, y1), ..., (x4, y4)]
    paired_vertices = [(vertices[i], vertices[i+1]) for i in range(0, 8, 2)]

    elements_data = [{
        "vertices": paired_vertices,
        "normalized": True
    }]

    output_path = os.path.join(UPLOAD_DIR, f"blurred_{image_filename}")
    blur_result = blur_combined_elements(image_path, output_path, elements_data)

    print("Blur completed. Returning file:", output_path)

    return FileResponse(output_path, media_type="image/jpeg", filename=f"blurred_{file.filename}")

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
