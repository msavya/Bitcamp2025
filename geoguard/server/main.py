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
    img = cv2.imread(path)

    for object_ in objects:
        if(object_.name == "Building"): 
            print(f"\n{object_.name} (confidence: {object_.score})")
            print("Normalized bounding polygon vertices: ")
            vertexX = 0
            vertexY = 0
            i = 0
            for vertex in object_.bounding_poly.normalized_vertices:
              if(i == 0):
                  vertexX += vertex.x
                  vertexY += vertex.y

              if(i == 2):
                  vertexX += vertex.x
                  vertexY += vertex.y

              i += 1
              print(f" - ({vertex.x}, {vertex.y})")
          
            x = vertexX / 2
            y = vertexY / 2
            print(f"Centroid: ({x}, {y})")

              # Read the image using OpenCV

              # Convert normalized coordinates to pixel values
            height, width, _ = img.shape
            center_x = int(x * width)
            center_y = int(y * height)

            # Draw the centroid
            cv2.circle(img, (center_x, center_y), radius=10, color=(0, 0, 255), thickness=-1)

    cv2.imwrite('edited.png', img)




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

print(localize_objects("landmarks.webp"))
print(text_identification("street_signs.jpeg"))