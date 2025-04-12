import os
from google.cloud import vision
import cv2
from dotenv import load_dotenv 

load_dotenv()
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv('GOOGLE_CLOUD_OBJECT_KEY')

def localize_objects(path): 
    """Localize objects in the local image.
    Args:
    path: The path to the local file.
    """

    client = vision.ImageAnnotatorClient()

    with open(path, "rb") as image_file:
        content = image_file.read()
    image = vision.Image(content=content)

    objects = client.object_localization(image=image).localized_object_annotations

    print(f"Number of objects found: {len(objects)}")
    for object_ in objects:
        if(object_.name == "Building") or (object_.name == "Church") or (object_.name == "Temple") : 
            print(f"\n{object_.name} (confidence: {object_.score})")
            print("Normalized bounding polygon vertices: ")
            for vertex in object_.bounding_poly.normalized_vertices:
                print(f" - ({vertex.x}, {vertex.y})")

def text_identification(path):
    
    client = vision.ImageAnnotatorClient()

    with open(path, "rb") as image_file:
        content = image_file.read()
    
    img = vision.Image(content=content)
        
    response = client.text_detection(image=img)
    texts = response.text_annotations  # First entry is the full text, others are words/lines
    
    bounding_boxes = []
    
    # Draw bounding boxes (skip index 0 to avoid the whole block)
    for text in texts[1:]:
        vertices = text.bounding_poly.vertices
        box = [(vertex.x, vertex.y) for vertex in vertices]
        bounding_boxes.append({
            'text': text.description,
            'vertices': box
        })

    return bounding_boxes

print(localize_objects("church.jpg"))
print(text_identification("street_signs.jpeg"))