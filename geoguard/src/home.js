import './App.css';
import UploadButton from "./components/uploadButton"

function Home() {
  const handleFileSelect = (file) => {
    //add server logic
    console.log("Selected file:", file);
  };
  return (
    <>
    <div class="body" className="bg-custom-bg bg-cover bg-center min-h-screen">
        <div className ="text-[40px] text-center my-12">
          <h1 className ="font-bold">GeoGuard</h1>
          <p className = "text-[#E78743] font-bold">Hide location information in images and videos</p>
          <p>Protect your safety</p>
        </div>
        <div class="secondhalf" className="flex flex-row justify-center items-center gap-[70px]">
          <div class="leftBox">
          <img src="change.png" alt="image" className="w-[450px] h-[300px]"/>
          </div>
          <div class="rightBox" className="bg-[#F7EADB] px-[40px] py-[30px] pt-[40px] rounded-[25px] shadow-lg w-[500px] h-[330px]">
            <div class="dashed" className = "border-2 border-dashed border-[#000000] px-[15px] pt-[15px] pb-[35px] flex flex-col items-center rounded-[25px]">
              <img src="image.png" alt="imageicon" className="w-[140px] h-[140px]"/>
              <UploadButton onFileSelect={handleFileSelect} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


export default Home;
