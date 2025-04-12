import './App.css';
import { Routes, Route } from "react-router-dom";
import Home from "./home";
import Identify from "./identify";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/identify" element={<Identify />} />
      </Routes>
    </>
  );
}

export default App;
