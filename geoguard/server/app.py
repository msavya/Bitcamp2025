from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
import shutil
import os
import cv2
import uuid
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
import google.generativeai as genai
from main import blur_combined_elements, text_identification, localize_objects

# Load .env variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.0-flash")

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
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.post("/blur-region/")
async def blur_region(
    file: UploadFile = File(...),
    regions: List[str] = Form(...),
):

    blur_inputs = []


    for region_str in regions:
        region = json.loads(region_str)
        if len(region) != 8:
            return {"error": "Each region must have exactly 8 coordinates"}
        paired_vertices = [(region[i], region[i+1]) for i in range(0, 8, 2)]
        blur_inputs.append({
            "vertices": paired_vertices,
            "normalized": True
        })
  
    print("HERE")
    # Save file locally
    image_filename = f"{uuid.uuid4()}.jpg"
    image_path = os.path.join(UPLOAD_DIR, image_filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    paired_vertices = [(vertices[i], vertices[i+1]) for i in range(0, 8, 2)]

    blurred_filename = f"blurred_{image_filename}"
    output_path = os.path.join(UPLOAD_DIR, blurred_filename)
    blur_combined_elements(image_path, output_path, blur_inputs)


    print("HERE 3")
    # Run detections
    text_boxes = text_identification(output_path)
    building_boxes = localize_objects(output_path)
  
    print(len(building_boxes))


    print("URL", f"/uploads/{blurred_filename}")


    # Return JSON response with correct URL
    return {
        "success": True,
        "blurred_image_url": f"/uploads/{blurred_filename}",
        "detections": {
            "text": text_boxes,
            "buildings": building_boxes
        }
    }


@app.post("/upload/image")
async def upload_photo(file: UploadFile = File(...)):
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


@app.post("/detect-text")
async def detect_text(request: Request):
    data = await request.json()
    base64_image = data.get("image")

    if not base64_image:
        return {"error": "No image data received."}

    try:
        header, base64_data = base64_image.split(",", 1) if "," in base64_image else ("", base64_image)
        image_data = base64.b64decode(base64_data)
        
        np_arr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        temp_filename = f"{uuid.uuid4()}.jpg"
        temp_path = os.path.join(UPLOAD_DIR, temp_filename)
        cv2.imwrite(temp_path, img)

        text_boxes = text_identification(temp_path)
        texts = [box["text"] for box in text_boxes if box.get("text")]

        if texts:
            safety_prompt = (
                "I'm a child about to livestream. Analyze these text elements from my surroundings: "
                f"{texts}. Does any text reveal my location to potential stalkers? "
                "Respond in ONE sentence with either: "
                "'Risk: [Yes/No] because [brief reason]' "
                "Focus specifically on location-revealing information like addresses, "
                "business names, license plates, or school identifiers."
            )

            # Get Gemini's safety analysis
            response = model.generate_content(safety_prompt)
            summary = response.text
        else:
            summary = "No text detected."

        return {
            "texts": texts,
            "summary": summary
        }

    except Exception as e:
        return {"error": f"Failed to process image: {str(e)}"}
