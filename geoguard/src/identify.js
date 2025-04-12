import React, { useState, useEffect, useRef } from "react";
import AddButton from "./components/addButton";
import PictureView from "./components/pictureView";
import EmptyView from "./components/emptyView";
import ConfirmBlur from "./components/confirmBlur";

function Identify() {
  const [pictures, setPictures] = useState([]);
  const [currentPictureIndex, setCurrentPictureIndex] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [coordinatesMap, setCoordinatesMap] = useState({});
  const [selectedDotIndex, setSelectedDotIndex] = useState(null);
  const [selectedDotData, setSelectedDotData] = useState(null);
  const [fullBoundingBoxes, setFullBoundingBoxes] = useState({});


  const [displayPopup, setDisplayPopup] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    if (pictures.length > 0 && currentPictureIndex === null) {
      setCurrentPictureIndex(0);
    } else if (pictures.length === 0) {
      setCurrentPictureIndex(null);
    }
  }, [pictures]);

  const addPictureFile = (file) => {
    const fileUrl = URL.createObjectURL(file);
    const newPictures = [...pictures, { url: fileUrl, file }];
    setPictures(newPictures);
    setCurrentPictureIndex(newPictures.length - 1);
    setDisplayPopup(false);

    const formData = new FormData();
    formData.append("file", file);
    fetch("http://localhost:8000/upload/image", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Upload successful:", data);

        const buildingCoords = (data.building_bounding_boxes || []).map(b => ({
          x: b.normalized_centroid[0],
          y: b.normalized_centroid[1],
        }));

        const textCoords = (data.text_bounding_boxes || []).map(t => ({
          x: t.normalized_centroid[0],
          y: t.normalized_centroid[1],
        }));

        const allCoords = [...buildingCoords, ...textCoords];

        const boxes = data.building_bounding_boxes.concat(data.text_bounding_boxes);


        setFullBoundingBoxes(prev => ({
          ...prev,
          [fileUrl]: boxes.map(box => ({
            vertices: box.vertices, // [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            type: box.type || 'unknown' // optional: track what type of object
          }))
        }));

        setCoordinatesMap(prev => ({
          ...prev,
          [fileUrl]: allCoords
        }));
      })
      .catch((err) => {
        console.error("Upload error:", err);
      });
  };

  const submitBlurRequest = async () => {
  if (!selectedDotData || !selectedDotData.fileUrl) return;

  const originalFile = pictures.find(p => p.url === selectedDotData.fileUrl)?.file;
  if (!originalFile) {
    console.error("Original file not found");
    return;
  }

  // 1. Get the full bounding box vertices from your state
  const currentBoxes = fullBoundingBoxes[selectedDotData.fileUrl] || [];
  const selectedBox = currentBoxes[selectedDotIndex]; // Get the specific box

  if (!selectedBox || !selectedBox.vertices) {
    console.error("No bounding box found for selected dot");
    return;
  }

  // 2. Flatten the vertices array [[x1,y1], [x2,y2], ...] → [x1,y1,x2,y2,...]
  const flatVertices = selectedBox.vertices.flat();

  // 3. Prepare FormData
  const formData = new FormData();
  formData.append("file", originalFile);
  
  // 4. Append each coordinate individually
  flatVertices.forEach(coord => {
    formData.append("vertices", coord.toString());
  });

  try {
    const response = await fetch("http://localhost:8000/blur-region/", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Update state
      setPictures(prev => prev.map(pic => 
        pic.url === selectedDotData.fileUrl 
          ? { ...pic, url: blobUrl } 
          : pic
      ));
      
      setDisplayPopup(false);
      setSelectedDotData(null);
      setSelectedDotIndex(null);
    } else {
      console.error("Blur request failed:", await response.text());
    }
  } catch (error) {
    console.error("Request error:", error);
  }
};

  // Ensure that `currentCoordinates` is initialized before accessing it
  const currentCoordinates = coordinatesMap[pictures[currentPictureIndex]?.url] || [];

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight,
      });
    }
  };

  const handleDownload = () => {
    if (currentPictureIndex !== null) {
      const link = document.createElement("a");
      link.href = pictures[currentPictureIndex].url;
      link.download = `image-${currentPictureIndex}.jpg`;
      link.click();
    }
  };

  const handleDelete = (index) => {
    URL.revokeObjectURL(pictures[index].url);
    const deletedUrl = pictures[index].url;

    const newPictures = pictures.filter((_, i) => i !== index);
    setPictures(newPictures);

    setCoordinatesMap((prev) => {
      const newMap = { ...prev };
      delete newMap[deletedUrl];
      return newMap;
    });

    if (currentPictureIndex === index) {
      setCurrentPictureIndex(
        newPictures.length > 0 ? Math.min(index, newPictures.length - 1) : null
      );
    } else if (currentPictureIndex > index) {
      setCurrentPictureIndex(currentPictureIndex - 1);
    }
  };

  const handleThumbnailClick = (index) => {
    setCurrentPictureIndex(index);
  };


  return (
    <div className="body bg-custom-bg bg-cover bg-center min-h-screen flex flex-col items-center justify-center p-4">
      {/* Main Image Container */}
      <div className="flex flex-row items-center gap-[70px]">
        <div className="mb-8 flex justify-center" style={{ height: "50vh" }}>
          {currentPictureIndex !== null && pictures.length > 0 ? (
            <div className="relative h-full">
              <img
                ref={imageRef}
                src={pictures[currentPictureIndex].url}
                alt={`Uploaded ${currentPictureIndex + 1}`}
                onLoad={handleImageLoad}
                className="h-full w-auto object-contain rounded-2xl shadow-lg border-2 border-gray-300"
                style={{ maxWidth: "100%" }}
              />
              {/* Coordinate Markers */}
              {currentCoordinates.map((coord, index) => (
                <div
                  key={index}
                  onClick={() => {
                    const isSameDot = selectedDotIndex === index;
                    const newIndex = isSameDot ? null : index;
                    setSelectedDotIndex(newIndex);

                    if (!isSameDot) {
                      const coord = currentCoordinates[index];
                      const newDotData = {
                        fileUrl: pictures[currentPictureIndex].url,
                        coordinates: coord,
                      };
                      setSelectedDotData(newDotData);
                      setDisplayPopup(true);
                    } else {
                      setSelectedDotData(null); // deselecting
                      setDisplayPopup(false);
                    }
                  }}
                  className={`absolute rounded-full transition-colors duration-200 ${
                    selectedDotIndex === index ? "bg-pink-500 border-2 border-black" : "bg-red-500"
                  }`}
                  style={{
                    width: "12px",
                    height: "12px",
                    left: `${coord.x * imageSize.width}px`,
                    top: `${coord.y * imageSize.height}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg">
                {currentPictureIndex + 1}/{pictures.length}
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl">
              <p className="text-gray-500 text-lg">Select an image from below</p>
            </div>
          )}
        </div>
        {displayPopup && (
          <ConfirmBlur
            onConfirm={submitBlurRequest}
            onCancel={() => {
              setDisplayPopup(false);
              setSelectedDotData(null);
              setSelectedDotIndex(null);
            }}
          />
        )}
      </div>

      {/* Download Button */}
      {currentPictureIndex !== null && pictures.length > 0 && (
        <button
          onClick={handleDownload}
          className="bg-[#E78743] hover:bg-[#D67632] transition-colors rounded-full text-white text-xl font-semibold py-3 px-8 mb-8 shadow-md"
        >
          Download Current Image
        </button>
      )}

      {/* Thumbnail Gallery */}
      <div className="flex flex-wrap gap-4 justify-center max-w-6xl">
        <AddButton onFileSelect={addPictureFile} />
        {pictures.length === 0 ? (
          <EmptyView />
        ) : (
          pictures.map((picture, index) => (
            <PictureView
              key={index}
              picture={picture.url}
              isActive={index === currentPictureIndex}
              onDelete={() => handleDelete(index)}
              onClick={() => handleThumbnailClick(index)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Identify;
