import AddButton from "./components/addButton";
import PictureView from "./components/pictureView"; // Assuming you already have this component
import EmptyView from "./components/emptyView";
import { useState, useEffect } from "react";

function Identify() {
  const [pictures, setPictures] = useState([]);
  const [currentPictureIndex, setCurrentPictureIndex] = useState(null);

  // Set first picture as current when added
  useEffect(() => {
    if (pictures.length > 0 && currentPictureIndex === null) {
      setCurrentPictureIndex(0);
    } else if (pictures.length === 0) {
      setCurrentPictureIndex(null);
    }
  }, [pictures]); 

  const addPictureFile = (file) => {
    const fileUrl = URL.createObjectURL(file);
    setPictures(prev => {
      const newPictures = [...prev, { url: fileUrl, file }];
      // Update currentPictureIndex after pictures have been updated
      setCurrentPictureIndex(newPictures.length - 1);
      return newPictures;
    });
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
    const newPictures = pictures.filter((_, i) => i !== index);
    setPictures(newPictures);
    
    // Adjust current picture index
    if (currentPictureIndex === index) {
      setCurrentPictureIndex(newPictures.length > 0 ? 
        Math.min(index, newPictures.length - 1) : 
        null);
    } else if (currentPictureIndex > index) {
      setCurrentPictureIndex(currentPictureIndex - 1);
    }
  };

  const handleThumbnailClick = (index) => {
    setCurrentPictureIndex(index);
    console.log(`Thumbnail ${index + 1} clicked, updating current index to ${index}`);
  };

  return (
    <div className="body bg-custom-bg bg-cover bg-center min-h-screen flex flex-col items-center justify-center p-4">
      {/* Main Image Container - Fixed height, variable width */}
      <div className="mb-8 flex justify-center" style={{ height: '50vh' }}>
        {currentPictureIndex !== null && pictures.length > 0 ? (
          <div className="relative h-full">
            <img
              src={pictures[currentPictureIndex].url}
              alt={`Uploaded ${currentPictureIndex + 1}`}
              className="h-full w-auto object-contain rounded-2xl shadow-lg border-2 border-gray-300"
              style={{ maxWidth: '100%' }}
            />
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
