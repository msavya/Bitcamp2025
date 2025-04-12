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

    object_data = []

    img = cv2.imread(path)
    if img is None:
        return "Error: Image not found or unreadable", []

    height, width, _ = img.shape

    for object_ in objects:
        if object_.name in ["Building", "Church", "Temple"]:
            
            vertices = []
            for vertex in object_.bounding_poly.normalized_vertices:
                vertices.append((vertex.x, vertex.y))

            # Compute centroid (average of all vertices)
            x = sum(v[0] for v in vertices) / len(vertices)
            y = sum(v[1] for v in vertices) / len(vertices)

            # Convert to pixel coordinates
            center_x = int(x * width)
            center_y = int(y * height)

            # Convert back to normalized coordinates
            normalized_center_x = center_x / width
            normalized_center_y = center_y / height

            object_data.append({
                'name': object_.name,
                'confidence': object_.score,
                'vertices': vertices,
                'normalized_centroid': (normalized_center_x, normalized_center_y),
                'normalized': True
            })

    return object_data

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
    image = cv2.imread(path)

    if image is None:
        return "Error: Image not found or unreadable", []

    height, width = image.shape[:2]

    response = client.text_detection(image=img)
    texts = response.text_annotations

    output = f"Number of text elements found: {len(texts)-1}\n"
    bounding_boxes = []

    for text in texts[1:]:  # Skip index 0 (full block)
        vertices = text.bounding_poly.vertices
        box = [(vertex.x, vertex.y) for vertex in vertices]

        # Compute centroid (average of all vertices)
        x = sum(v.x for v in vertices) / len(vertices)
        y = sum(v.y for v in vertices) / len(vertices)

        # Normalize centroid coordinates
        normalized_x = x / width
        normalized_y = y / height

        # Convert to pixel coordinates for visualization
        center_x = int(normalized_x * width)
        center_y = int(normalized_y * height)

        # Update dictionary with normalized centroid
        bounding_boxes.append({
            'text': text.description,
            'vertices': box,
            'normalized_centroid':(normalized_x, normalized_y),
            'normalized': True  # now storing normalized centroid
        })

    return bounding_boxes


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
    
    # Blur all detected elements
    blur_result = blur_combined_elements(image_path, output_path, all_elements)
    
    return blur_result