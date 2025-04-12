import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = 'C:\\Users\\eshav\\Desktop\\Code\\google-cloud-vision-test\\exampletestvision-1dc6ee4ed242.json'
def localize_objects(path):
    """Localize objects in the local image.

    Args:
    path: The path to the local file.
    """
    from google.cloud import vision

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


print(localize_objects("church.jpg"))