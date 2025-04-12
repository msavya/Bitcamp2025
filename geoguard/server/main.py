import os
import io
from google.cloud import vision
import cv2
import numpy as np
from dotenv import load_dotenv
import shutil

# Load environment variables
load_dotenv()
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv('GOOGLE_CLOUD_OBJECT_KEY')

def localize_objects(path):
    """
    Localize objects in the local image and return information as a string.

    Args:
        path: The path to the local file.
        
    Returns:
        A tuple containing:
        - A string with the detection results
        - A list of dictionaries with object data (name, confidence, coordinates)
    """
    client = vision.ImageAnnotatorClient()

    with open(path, "rb") as image_file:
        content = image_file.read()
    image = vision.Image(content=content)

    objects = client.object_localization(image=image).localized_object_annotations

    output = f"Number of objects found: {len(objects)}\n"
    object_data = []
    
    for object_ in objects:
        if object_.name in ["Building", "Church", "Temple"]:
            output += f"\n{object_.name} (confidence: {object_.score})\n"
            output += "Normalized bounding polygon vertices:\n"
            vertices = []
            for vertex in object_.bounding_poly.normalized_vertices:
                output += f" - ({vertex.x}, {vertex.y})\n"
                vertices.append((vertex.x, vertex.y))
            object_data.append({
                'name': object_.name,
                'confidence': object_.score,
                'vertices': vertices,
                'normalized': True
            })
    
    return output, object_data

def text_identification(path):
    """
    Identify text in the local image and return information.

    Args:
        path: The path to the local file.
        
    Returns:
        A tuple containing:
        - A string with the detection results
        - A list of dictionaries with text data and coordinates
    """
    client = vision.ImageAnnotatorClient()

    with open(path, "rb") as image_file:
        content = image_file.read()
    
    img = vision.Image(content=content)
        
    response = client.text_detection(image=img)
    texts = response.text_annotations

    output = f"Number of text elements found: {len(texts)-1}\n"
    bounding_boxes = []
    
    for text in texts[1:]:  # Skip index 0 (full block)
        vertices = text.bounding_poly.vertices
        box = [(vertex.x, vertex.y) for vertex in vertices]
        bounding_boxes.append({
            'text': text.description,
            'vertices': box,
            'normalized': False
        })
        output += f"Text: '{text.description}', Coordinates: {box}\n"

    return output, bounding_boxes

def blur_combined_elements(image_path, output_path, elements_data):
    """
    Blur both objects and text in an image based on their coordinates.

    Args:
        image_path: Path to the input image
        output_path: Path to save the blurred image
        elements_data: List of dictionaries with element information including vertices
    """
    image = cv2.imread(image_path)
    if image is None:
        return f"Error: Could not read image at {image_path}"
        
    height, width = image.shape[:2]
    result = image.copy()
    combined_mask = np.zeros((height, width), dtype=np.uint8)
    
    for element in elements_data:
        vertices = element['vertices']
        pixel_vertices = []

        if element.get('normalized', False):
            for x, y in vertices:
                pixel_vertices.append((int(x * width), int(y * height)))
        else:
            pixel_vertices = vertices
        
        points = np.array(pixel_vertices, np.int32).reshape((-1, 1, 2))
        cv2.fillPoly(combined_mask, [points], 255)
    
    blurred = cv2.GaussianBlur(result, (99, 99), 30)
    result = np.where(combined_mask[:, :, np.newaxis] == 255, blurred, result)
    cv2.imwrite(output_path, result)
    
    return f"Image with blurred elements saved to {output_path}"

def process_image_for_privacy(image_path, output_path):
    """
    Process an image to detect and blur sensitive content (buildings and text).

    Args:
        image_path: Path to the input image
        output_path: Path to save the processed image
    """
    if not os.path.exists(image_path):
        return f"Error: Image not found at {image_path}"
    
    buildings_result, buildings_data = localize_objects(image_path)
    print("Buildings detection results:\n" + buildings_result)
    
    text_result, text_data = text_identification(image_path)
    print("Text detection results:\n" + text_result)
    
    all_elements = buildings_data + text_data

    if not all_elements:
        print("No sensitive elements detected in the image.")
        shutil.copy(image_path, output_path)
        return f"No sensitive content detected. Original image saved to {output_path}"
    
    return blur_combined_elements(image_path, output_path, all_elements)

# Example usage
if __name__ == "__main__":
    test_image_path = "nyc.jpeg"
    output_image_path = "nyc_privacy_protected.jpg"

    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    result = process_image_for_privacy(test_image_path, output_image_path)
    print(result)
