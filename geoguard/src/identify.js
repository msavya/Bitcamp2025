import React, { useState, useEffect, useRef } from "react";
import AddButton from "./components/addButton";
import PictureView from "./components/pictureView";
import EmptyView from "./components/emptyView";
import ConfirmBlur from "./components/confirmBlur";
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';

function Identify({ uploadedFile }) {
  // State management
  const { state } = useLocation();
  const [mainImage, setMainImage] = useState(null);
  const [pictures, setPictures] = useState([]);
  const [currentPictureIndex, setCurrentPictureIndex] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [coordinatesMap, setCoordinatesMap] = useState({});
  const [selectedDotIndex, setSelectedDotIndex] = useState(null);
  const [selectedDotData, setSelectedDotData] = useState(null);
  const [fullBoundingBoxes, setFullBoundingBoxes] = useState({});
  const navigate = useNavigate();  
  const [blurRegions, setBlurRegions] = useState({});
  const [viewMode, setViewMode] = useState("blurred");
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);
  const [displayPopup, setDisplayPopup] = useState(false);
  const [selectedBlurIndex, setSelectedBlurIndex] = useState(null);
  const imageRef = useRef(null);

  // Helper to get current picture data
  const currentPicture = pictures[currentPictureIndex];
  const currentUrl = currentPicture?.url;
  const currentCoordinates = currentUrl ? coordinatesMap[currentUrl] || [] : [];
  const currentBlurRegions = currentUrl ? blurRegions[currentUrl] || [] : [];

  // Effect to handle picture index changes
  useEffect(() => {
    if (pictures.length > 0 && currentPictureIndex === null) {
      setCurrentPictureIndex(0);
    } else if (pictures.length === 0) {
      setCurrentPictureIndex(null);
    }
  }, [pictures]);

  useEffect(() => {
    if (state && state.imageFile) {
      const newImage = state.imageFile;
      const fileUrl = URL.createObjectURL(newImage);
      console.log(newImage);
      addPictureFile(newImage);
    }
  }, [state]);

  // Add new image file
  const addPictureFile = (file) => {
    const fileUrl = URL.createObjectURL(file);
    const newPicture = {
      url: fileUrl,
      originalFile: file,
      latestFile: file,
      originalUrl: fileUrl
    };

    setPictures(prev => [...prev, newPicture]);
    setCurrentPictureIndex(pictures.length);
    setDisplayPopup(false);

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://localhost:8000/upload/image", {
      method: "POST",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        const buildingCoords = (data.building_bounding_boxes || []).map(b => ({
          x: b.normalized_centroid[0],
          y: b.normalized_centroid[1],
        }));

        const textCoords = (data.text_bounding_boxes || []).map(t => ({
          x: t.normalized_centroid[0],
          y: t.normalized_centroid[1],
        }));

        const allCoords = [...buildingCoords, ...textCoords]
        const boxes = data.building_bounding_boxes.concat(data.text_bounding_boxes)

        setFullBoundingBoxes(prev => ({
          ...prev,
          [fileUrl]: boxes.map(box => ({ vertices: box.vertices }))
        }));

        setCoordinatesMap(prev => ({
          ...prev,
          [fileUrl]: allCoords
        }));
      })
      .catch(err => console.error("Upload error:", err));
  };

  // Handle blur submission
  const submitBlurRequest = async () => {
    if (!selectedDotData || !selectedDotData.fileUrl) return;

    const fileUrl = selectedDotData.fileUrl;
    const pic = pictures.find(p => p.url === fileUrl);
    if (!pic) return;

    const selectedBox = fullBoundingBoxes[fileUrl]?.[selectedDotIndex];
    if (!selectedBox) return;

    const flatVertices = selectedBox.vertices.flat();
    const formData = new FormData();
    formData.append("file", pic.latestFile);
    flatVertices.forEach(coord => formData.append("vertices", coord.toString()));

    // Wrap it in a regions field, as a JSON string
    if (flatVertices.length === 8) {
      formData.append("regions", JSON.stringify(flatVertices));
    } else {
      console.warn("Selected box has invalid number of coordinates:", flatVertices);
    }


    try {
      const blurRes = await fetch("http://localhost:8000/blur-region/", {
        method: "POST",
        body: formData,
      });

      if (!blurRes.ok) throw new Error(await blurRes.text());
      
      const result = await blurRes.json();
      const imageUrl = `http://localhost:8000${result.blurred_image_url}`;
      const imageBlob = await (await fetch(imageUrl)).blob();
      const newUrl = URL.createObjectURL(imageBlob);
      const newFile = new File([imageBlob], "blurred.jpg", { type: imageBlob.type });

      // Update state with new blurred image
      setPictures(prev => prev.map(p =>
        p.url === fileUrl
          ? { ...p, url: newUrl, latestFile: newFile }
          : p
      ));

      setBlurRegions(prev => {
        const previousPoints = prev[fileUrl] || [];
        const updated = {
          ...prev,
          [newUrl]: [...previousPoints, flatVertices] // ✅ Add new point on top of old ones
        };
        delete updated[fileUrl]; // Optional cleanup
        return updated;
      }); 

      // Transfer coordinate data to new URL
      setCoordinatesMap(prev => ({
        ...prev,
        [newUrl]: prev[fileUrl]
      }));

      setFullBoundingBoxes(prev => ({
        ...prev,
        [newUrl]: prev[fileUrl]
      }));

      // Clean up old references
      setCoordinatesMap(prev => {
        const map = { ...prev };
        delete map[fileUrl];
        return map;
      });

      setFullBoundingBoxes(prev => {
        const map = { ...prev };
        delete map[fileUrl];
        return map;
      });

      setSelectedDotData(null);
      setSelectedDotIndex(null);
      setDisplayPopup(false);
      setViewMode("blurred");

    } catch (error) {
      console.error("Blur failed:", error);
    }
  };

  // Updated removeBlurredRegion function
  const removeBlurredRegion = async (index) => {
    if (!currentUrl || !currentPicture) return;
  
    try {
      // Get current state values directly from the component's closure
      const currentPic = pictures.find(p => p.url === currentUrl);
      if (!currentPic) return;
  
      const currentBlurs = [...(blurRegions[currentUrl] || [])];
      if (index >= currentBlurs.length || index < 0) return;
  
      // Create updated blur regions
      const updatedBlurRegions = [...currentBlurs];
      updatedBlurRegions.splice(index, 1);
  
      // If no blur regions left, restore original image
      if (updatedBlurRegions.length === 0) {
        setPictures(prev => prev.map(p =>
          p.url === currentUrl
            ? { ...p, url: currentPic.originalUrl, latestFile: currentPic.originalFile }
            : p
        ));
  
        setBlurRegions(prev => {
          const updated = {
            ...prev,
            [currentPicture.url]: prev[currentPicture.url].filter((point, i) => {
              console.log(`Trying to delete point at index ${i}`);
              return i !== index;
            })
          
          };
          console.log("Updated regions after delete:", updated[currentPicture.url]);
          return updated;
        });

        setSelectedBlurIndex(null);
        return;
      }
  
      // Prepare form data with original image and remaining blur regions
      const formData = new FormData();
      formData.append("file", currentPic.originalFile);
      
      updatedBlurRegions.forEach(region => {
        if (region.length === 8) {
          formData.append("regions", JSON.stringify(region));
        } else {
          console.warn("Skipping invalid region:", region);
        }
      });
 
  
      // Process the image with remaining blur regions
      const blurRes = await fetch("http://localhost:8000/blur-region/", {
        method: "POST",
        body: formData,
      });
  
      if (!blurRes.ok) {
        const errorText = await blurRes.text();
        throw new Error(`Server error: ${errorText}`);
      }
      
      const result = await blurRes.json();
      
      // Validate the response
      if (!result?.blurred_image_url) {
        // Fallback to client-side blur removal if server fails
        console.warn("Server didn't return blurred image URL, using fallback");
        return fallbackBlurRemoval(currentPic, updatedBlurRegions);
      }
  
      const imageUrl = `http://localhost:8000${result.blurred_image_url}`;
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch blurred image");
      }
  
      const imageBlob = await imageResponse.blob();
      const newUrl = URL.createObjectURL(imageBlob);
      const newFile = new File([imageBlob], "blurred.jpg", { type: imageBlob.type });
  
      // Update state
      setPictures(prev => prev.map(p =>
        p.url === currentUrl
          ? { ...p, url: newUrl, latestFile: newFile }
          : p
      ));
  
      setBlurRegions(prev => ({
        ...prev,
        [newUrl]: updatedBlurRegions
      }));
  
      // Clean up old URL
      URL.revokeObjectURL(currentUrl);
      setSelectedBlurIndex(null);
  
    } catch (error) {
      console.error("Failed to remove blur:", error);
      // Optionally show error to user
    }
  };
  
  // Fallback method when server fails
  const fallbackBlurRemoval = (currentPic, updatedBlurRegions) => {
    // Create a canvas and manually reapply remaining blurs
    const img = new Image();
    img.src = currentPic.originalUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Apply remaining blur regions
      updatedBlurRegions.forEach(region => {
        const [x1, y1, x2, y2, x3, y3, x4, y4] = region;
        // Simple rectangle blur - for production you'd want more sophisticated blurring
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.moveTo(x1 * img.width, y1 * img.height);
        ctx.lineTo(x2 * img.width, y2 * img.height);
        ctx.lineTo(x3 * img.width, y3 * img.height);
        ctx.lineTo(x4 * img.width, y4 * img.height);
        ctx.closePath();
        ctx.fill();
      });
      
      // Create new image URL
      canvas.toBlob(blob => {
        const newUrl = URL.createObjectURL(blob);
        const newFile = new File([blob], "blurred-fallback.jpg", { type: 'image/jpeg' });
        
        setPictures(prev => prev.map(p =>
          p.url === currentUrl
            ? { ...p, url: newUrl, latestFile: newFile }
            : p
        ));
        
        setBlurRegions(prev => ({
          ...prev,
          [newUrl]: updatedBlurRegions
        }));
        
        URL.revokeObjectURL(currentUrl);
        setSelectedBlurIndex(null);
      }, 'image/jpeg', 0.9);
    };
  };

  // Updated renderBlurOverlays function
  const renderBlurOverlays = () => {
    if (!showBlurOverlay || !currentUrl) return null;
    
    const currentBlurs = blurRegions[currentUrl] || [];
    
    return currentBlurs.map((region, i) => {
      const vertices = region;
      const minX = Math.min(...vertices.filter((_, idx) => idx % 2 === 0));
      const minY = Math.min(...vertices.filter((_, idx) => idx % 2 === 1));
      const width = Math.max(...vertices.filter((_, idx) => idx % 2 === 0)) - minX;
      const height = Math.max(...vertices.filter((_, idx) => idx % 2 === 1)) - minY;

      return (
        <div 
          key={`${currentUrl}-${i}`} // Unique key with URL and index
          className="absolute group"
          style={{
            left: `${minX * 100}%`,
            top: `${minY * 100}%`,
            width: `${width * 100}%`,
            height: `${height * 100}%`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBlurIndex(i === selectedBlurIndex ? null : i);
          }}
        >
          <div className={`absolute inset-0 ${
            selectedBlurIndex === i 
              ? "bg-red-500 opacity-50 border-2 border-white" 
              : "bg-red-500 opacity-30"
          } pointer-events-none`} />
          
          {selectedBlurIndex === i && (
            <button
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 hover:bg-red-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                removeBlurredRegion(i);
              }}
              disabled={!currentUrl} // Disable if no current URL
            >
              ×
            </button>
          )}
        </div>
      );
    });
  };

  // Image load handler
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight,
      });
    }
  };

  // Download handler
  const handleDownload = () => {
    if (currentPictureIndex !== null) {
      const link = document.createElement("a");
      link.href = pictures[currentPictureIndex].url;
      link.download = `image-${currentPictureIndex}.jpg`;
      link.click();
    }
  };

  // Delete handler
  const handleDelete = (index) => {
    const deletedUrl = pictures[index].url;
    URL.revokeObjectURL(deletedUrl);

    setPictures(prev => prev.filter((_, i) => i !== index));
    
    setCoordinatesMap(prev => {
      const map = { ...prev };
      delete map[deletedUrl];
      return map;
    });

    setFullBoundingBoxes(prev => {
      const map = { ...prev };
      delete map[deletedUrl];
      return map;
    });

    setBlurRegions(prev => {
      const map = { ...prev };
      delete map[deletedUrl];
      return map;
    });

    if (currentPictureIndex === index) {
      setCurrentPictureIndex(
        pictures.length > 1 ? Math.min(index, pictures.length - 2) : null
      );
    } else if (currentPictureIndex > index) {
      setCurrentPictureIndex(currentPictureIndex - 1);
    }
  };

  // Get current image URL based on view mode
  const getCurrentImageUrl = () => {
    if (!currentPicture) return null;
    return viewMode === "original" 
      ? currentPicture.originalUrl 
      : currentPicture.url;
  };
  const handleClick = () => {
    navigate('/')
  }


  return (
    <div className="body bg-custom-bg bg-cover bg-center min-h-screen flex flex-col items-center justify-center p-4">
      <div class="backButton" className="absolute top-12 left-12 z-50">
        <button onClick ={handleClick} className="bg-[#E78743] text-white px-4 py-4 rounded-[25px] font-bold hover:bg-[#D67632] px-11">Back</button>
      </div>
      {/* Main Image Container */}
      <div className="flex flex-row items-center gap-[70px]">
        <div className="mb-8 flex justify-center" style={{ height: "50vh" }}>
          {currentPicture ? (
            <div className="relative h-full">
              <img
                ref={imageRef}
                src={getCurrentImageUrl()}
                alt={`Uploaded ${currentPictureIndex + 1}`}
                onLoad={handleImageLoad}
                className="h-full w-auto object-contain rounded-2xl shadow-lg border-2 border-gray-300"
                style={{ maxWidth: "100%" }}
              />
              
              {renderBlurOverlays()}
              
              {currentCoordinates.map((coord, index) => (
                <div
                  key={index}
                  onClick={() => {
                    const same = selectedDotIndex === index;
                    setSelectedDotIndex(same ? null : index);
                    setSelectedDotData(
                      same ? null : { 
                        fileUrl: currentPicture.url, 
                        coordinates: coord 
                      }
                    );
                    setDisplayPopup(!same);
                    setSelectedBlurIndex(null);
                  }}
                  className={`absolute rounded-full transition-colors duration-200 ${
                    selectedDotIndex === index
                      ? "bg-pink-500 border-2 border-black"
                      : "bg-red-500"
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

      {/* Control buttons */}
      {currentPicture && (
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setViewMode(viewMode === "original" ? "blurred" : "original")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "original" ? "bg-[#FEAE36] text-white" : "bg-gray-200"
            }`}
          >
            {viewMode === "original" ? "View Blurred" : "View Original"}
          </button>
          
          <button
            onClick={() => {
              setShowBlurOverlay(!showBlurOverlay);
              setSelectedBlurIndex(null);
            }}
            className={`px-4 py-2 rounded-lg ${
              showBlurOverlay ? "bg-red-600 text-white" : "bg-gray-200"
            }`}
          >
            {showBlurOverlay ? "Hide Blur Areas" : "Show Blur Areas"}
          </button>
          
          <button
            onClick={handleDownload}
            className="bg-[#E78743] hover:bg-[#D67632] text-white px-6 py-2 rounded-lg"
          >
            Download
          </button>
        </div>
      )}

      {/* Thumbnail gallery */}
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
              onClick={() => setCurrentPictureIndex(index)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Identify;