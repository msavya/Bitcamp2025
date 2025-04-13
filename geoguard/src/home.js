import './App.css';
import UploadButton from "./components/uploadButton"
import { GradualSpacing } from './components/gradualspacing';
import React, { useState } from "react";
import Cam from './components/cam';

function Home() {
  const handleFileSelect = (file) => {
    //add server logic
    console.log("Selected file:", file);
  };

  const [blurred, setBlurred] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const handleLiveToggle = () => {
    setBlurred(true);
    setShowPopup(true);
  }
  const closePopup = () => {
    setShowPopup(false);
    setBlurred(false);
  };
  
  return (
    <>
      <div class="body" className={`${blurred ? 'blur-sm' : ''} bg-custom-bg bg-cover bg-center min-h-screen`}>
        <div className ="text-[40px] text-center my-10">
          {/* <h1 className ="font-bold text-[50px]">GeoGuard</h1> */}
          <GradualSpacing text="GeoGuard" />
          <p className = "text-[#E78743] font-bold">Hide location information in images and videos</p>
          <p className = "text-[30px]">Protect your safety</p>
        </div>
        <div class="secondhalf" className="flex flex-row justify-center items-center gap-[70px]">
          <div class="leftBox">
          <img src="change.png" alt = "" className="w-[450px] h-[300px]"/>
          </div>
          <div class="rightBox" className="bg-[#F7EADB] px-[40px] py-[30px] pt-[40px] rounded-[25px] shadow-xl w-[500px] h-[330px]">
            <div class="dashed" className = "border-[3px] border-dashed border-[#000000] px-[15px] pt-[15px] pb-[35px] flex flex-col items-center rounded-[25px]">
              <img src="image.png" alt="imageicon" className="w-[140px] h-[140px]"/>
              <div class="Buttons" className="flex flex-row gap-[20px]">
                <UploadButton onFileSelect={handleFileSelect} />
                <button onClick={handleLiveToggle} className="bg-[#E78743] text-white px-4 py-4 rounded-[25px] font-bold hover:bg-[#D67632]">Live Detection</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPopup && (
          <div className="popup fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="popup-content bg-white rounded-lg p-8 w-[400px] flex flex-col justify-center">
              <h2 className="text-xl font-bold text-center">Live Detection</h2>
              <button
                onClick={closePopup}
                className="mt-4 bg-[#E78743] font-bold text-white px-4 py-2 rounded-lg hover:bg-[#D67632] transition-colors"
              >
                <Cam/>
                Close
              </button>
            </div>
          </div>
        )}
    </>
  );
}


export default Home;
