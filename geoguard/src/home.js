import './App.css';



function Home() {
  return (
    <>
      <div className="body bg-custom-bg bg-cover bg-center min-h-screen">
        <h1>GeoGuard</h1>
        <p>Hide location information in images</p>
        <p>Protect your safety</p>
        <div className="leftBox"></div>
        <div className="rightBox">
          <div className="dashed">
            <img src="image.png" alt="imageicon"/>
            <button>Upload image</button>
          </div>
        </div>
      </div>


    </>
  );
}


export default Home;
