import os
import io
import io
from google.cloud import vision
import cv2
import numpy as np
from dotenv import load_dotenv 

load_dotenv()
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv('GOOGLE_CLOUD_OBJECT_KEY')

def localize_objects(path):
    """Localize objects in the local image and return information as a string.
    
def localize_objects(path):
    """Localize objects in the local image and return information as a string.
    
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
    
    img = cv2.imread(path)

    for object_ in objects:
        if(object_.name == "Building") or (object_.name == "Church") or (object_.name == "Temple"):
            output += f"\n{object_.name} (confidence: {object_.score})\n"
            output += "Normalized bounding polygon vertices: \n"
            
            vertices = []
        if(object_.name == "Building") or (object_.name == "Church") or (object_.name == "Temple"):
            output += f"\n{object_.name} (confidence: {object_.score})\n"
            output += "Normalized bounding polygon vertices: \n"
            
            vertices = []
            for vertex in object_.bounding_poly.normalized_vertices:
                output += f" - ({vertex.x}, {vertex.y})\n"
                vertices.append((vertex.x, vertex.y))
            
            object_data.append({
                'name': object_.name,
                'confidence': object_.score,
                'vertices': vertices,
                'normalized': True  # Flag to indicate these are normalized coordinates
            })
    
    return output, object_data
                output += f" - ({vertex.x}, {vertex.y})\n"
                vertices.append((vertex.x, vertex.y))
            
            object_data.append({
                'name': object_.name,
                'confidence': object_.score,
                'vertices': vertices,
                'normalized': True  # Flag to indicate these are normalized coordinates
            })
    
    return output, object_data

def text_identification(path):
    """Identify text in the local image and return information.
    
    Args:
        path: The path to the local file.
        
    Returns:
        A tuple containing:
        - A string with the detection results
        - A list of dictionaries with text data and coordinates
    """
    """Identify text in the local image and return information.
    
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
    
    # Skip index 0 to avoid the whole block
    for text in texts[1:]:
        vertices = text.bounding_poly.vertices
        box = [(vertex.x, vertex.y) for vertex in vertices]
        bounding_boxes.append({
            'text': text.description,
            'vertices': box,
            'normalized': False  # Flag to indicate these are pixel coordinates
        })
        output += f"Text: '{text.description}', Coordinates: {box}\n"

    return output, bounding_boxes

def blur_combined_elements(image_path, output_path, elements_data):
    """Blur both objects and text in an image based on their coordinates.
    
    Args:
        image_path: Path to the input image
        output_path: Path to save the blurred image
        elements_data: List of dictionaries with element information including vertices
    """
    # Read the image
    image = cv2.imread(image_path)
    if image is None:
        return f"Error: Could not read image at {image_path}"
        
    height, width = image.shape[:2]
    
    # Create a copy of the image to work with
    result = image.copy()
    
    # Create a combined mask for all elements
    combined_mask = np.zeros((height, width), dtype=np.uint8)
    
    for element in elements_data:
        vertices = element['vertices']
        
        # Convert normalized coordinates to pixel coordinates if needed
        if element.get('normalized', False):
            pixel_vertices = []
            for x, y in vertices:
                pixel_x = int(x * width)
                pixel_y = int(y * height)
                pixel_vertices.append((pixel_x, pixel_y))
        else:
            # For text, coordinates are already in pixels
            pixel_vertices = vertices
        
        # Create points array for fillPoly
        points = np.array(pixel_vertices, np.int32)
        points = points.reshape((-1, 1, 2))
        
        # Add this element to the combined mask
        cv2.fillPoly(combined_mask, [points], 255)
    
    # Apply a strong blur to the entire image
    blurred = cv2.GaussianBlur(result, (99, 99), 30)
    
    # Copy the blurred regions to the result image using the mask
    result = np.where(combined_mask[:, :, np.newaxis] == 255, blurred, result)
    
    # Save the result
    cv2.imwrite(output_path, result)
    
    return f"Image with blurred elements saved to {output_path}"

def process_image_for_privacy(image_path, output_path):
    """Process an image to detect and blur sensitive content (buildings and text).
    
    Args:
        image_path: Path to the input image
        output_path: Path to save the processed image
    """
    # Check if the image exists
    if not os.path.exists(image_path):
        return f"Error: Image not found at {image_path}"
    
    # Get building/landmark data
    buildings_result, buildings_data = localize_objects(image_path)
    print("Buildings detection results:")
    print(buildings_result)
    
    # Get text data
    text_result, text_data = text_identification(image_path)
    print("Text detection results:")
    print(text_result)
    
    # Combine all elements that need to be blurred
    all_elements = buildings_data + text_data
    
    if not all_elements:
        print("No sensitive elements detected in the image.")
        # Just copy the original image if nothing to blur
        import shutil
        shutil.copy(image_path, output_path)
        return f"No sensitive content detected. Original image saved to {output_path}"
    
    # Blur all detected elements
    blur_result = blur_combined_elements(image_path, output_path, all_elements)
    
    return blur_result

# Example usage with the test image
test_image_path = "nyc.jpeg"
output_image_path = "nyc_privacy_protected.jpg"

# Make sure the script directory is the working directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Process the image
result = process_image_for_privacy(test_image_path, output_image_path)
print(result)

            'vertices': box,
            'normalized': False  # Flag to indicate these are pixel coordinates
        })
        output += f"Text: '{text.description}', Coordinates: {box}\n"

    return output, bounding_boxes

def blur_combined_elements(image_path, output_path, elements_data):
    """Blur both objects and text in an image based on their coordinates.
    
    Args:
        image_path: Path to the input image
        output_path: Path to save the blurred image
        elements_data: List of dictionaries with element information including vertices
    """
    # Read the image
    image = cv2.imread(image_path)
    if image is None:
        return f"Error: Could not read image at {image_path}"
        
    height, width = image.shape[:2]
    
    # Create a copy of the image to work with
    result = image.copy()
    
    # Create a combined mask for all elements
    combined_mask = np.zeros((height, width), dtype=np.uint8)
    
    for element in elements_data:
        vertices = element['vertices']
        
        # Convert normalized coordinates to pixel coordinates if needed
        if element.get('normalized', False):
            pixel_vertices = []
            for x, y in vertices:
                pixel_x = int(x * width)
                pixel_y = int(y * height)
                pixel_vertices.append((pixel_x, pixel_y))
        else:
            # For text, coordinates are already in pixels
            pixel_vertices = vertices
        
        # Create points array for fillPoly
        points = np.array(pixel_vertices, np.int32)
        points = points.reshape((-1, 1, 2))
        
        # Add this element to the combined mask
        cv2.fillPoly(combined_mask, [points], 255)
    
    # Apply a strong blur to the entire image
    blurred = cv2.GaussianBlur(result, (99, 99), 30)
    
    # Copy the blurred regions to the result image using the mask
    result = np.where(combined_mask[:, :, np.newaxis] == 255, blurred, result)
    
    # Save the result
    cv2.imwrite(output_path, result)
    
    return f"Image with blurred elements saved to {output_path}"

def process_image_for_privacy(image_path, output_path):
    """Process an image to detect and blur sensitive content (buildings and text).
    
    Args:
        image_path: Path to the input image
        output_path: Path to save the processed image
    """
    # Check if the image exists
    if not os.path.exists(image_path):
        return f"Error: Image not found at {image_path}"
    
    # Get building/landmark data
    buildings_result, buildings_data = localize_objects(image_path)
    print("Buildings detection results:")
    print(buildings_result)
    
    # Get text data
    text_result, text_data = text_identification(image_path)
    print("Text detection results:")
    print(text_result)
    
    # Combine all elements that need to be blurred
    all_elements = buildings_data + text_data
    
    if not all_elements:
        print("No sensitive elements detected in the image.")
        # Just copy the original image if nothing to blur
        import shutil
        shutil.copy(image_path, output_path)
        return f"No sensitive content detected. Original image saved to {output_path}"
    
    # Blur all detected elements
    blur_result = blur_combined_elements(image_path, output_path, all_elements)
    
    return blur_result

# Example usage with the test image
test_image_path = "nyc.jpeg"
output_image_path = "nyc_privacy_protected.jpg"

# Make sure the script directory is the working directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Process the image
result = process_image_for_privacy(test_image_path, output_image_path)
print(result)
