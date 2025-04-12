import AddButton from "./components/addButton";
import PictureView from "./components/pictureView"; // Assuming you already have this component
import EmptyView from "./components/emptyView";
import { useState } from "react";

function Identify() {
  const [pictures, setPictures] = useState([]);

  const addPictureFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.src = reader.result;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg"); // Convert to JPEG
        setPictures((prevPictures) => [...prevPictures, dataUrl]);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pictures[pictures.length - 1]; // Download the latest image
    link.download = "image.jpg"; // You can dynamically name the file based on the content
    link.click();
  };

  const handleDelete = (index) => {
    setPictures(pictures.filter((_, i) => i !== index)); // Remove the image at the given index
  };

  return (
    <>
      <div className="body bg-custom-bg bg-cover bg-center min-h-screen flex flex-col items-center justify-center">
        {/* Display the first image as a placeholder */}
        <div className="w-full max-w-4xl flex justify-center">
          <img
            src="rushmore.jpg"
            alt="Uploaded"
            className="h-96 w-auto object-contain rounded-2xl shadow-lg border border-gray-300"
          />
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="bg-[#E78743] hover:bg-blue-700 rounded-full text-black text-2xl font-bold py-2 px-10 mt-[30px]"
        >
          Download
        </button>

        {/* Uploaded Pictures Section */}
        <div className="flex flex-row mt-[30px] gap-[15px] items-center justify-center">
          <AddButton onFileSelect={addPictureFile} />

          {pictures.length === 0 ? (
            <EmptyView />
          ) : (
            pictures.map((picture, index) => (
              <PictureView
                key={index}
                picture={picture}
                onDelete={() => handleDelete(index)} // Pass delete handler
              />
            ))
          )}

        </div>
      </div>
    </>
  );
}

export default Identify;
