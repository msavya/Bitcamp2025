import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <>
      <div class="body" className="bg-custom-bg bg-cover bg-center min-h-screen">
        <h1>GeoGuard</h1>
        <p>Hide location information in images </p>
        <p>Protect your safety</p>
        <div class="leftBox">
        </div>
        <div class="rightBox">
          <div class="dashed">
            <img src="image.png" alt="imageicon"/>
            <button>Upload image</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
