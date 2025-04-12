from fastapi import FastAPI
from pydantic import BaseModel
from main import text_identification
from main import localize_objects


app = FastAPI()

class UserInput(BaseModel):
    file_path: str
    

@app.get("/upload/image")
def upload_photo(data: UserInput):
    
    text_bounding_boxes = text_identification(data.file_path)
    building_bounding_boxes = localize_objects(data.file_path)
    
    return {"text_bounding_boxes": text_bounding_boxes, "building_bounding_boxes": building_bounding_boxes}


#When user uploads image/video, it should go oto backend processing

#It should return the array of frames with centralized points
#If you click on point, it should be able to send the point selected to backend
#The backend should return with specific part of blurred image/video