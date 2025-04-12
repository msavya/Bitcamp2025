import React, { useState } from "react";

function Cam() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div>
      {!loaded && <p className="text-center">Loading camera...</p>}
      {/* INSERT CAMERA STUFF HERE */}
    </div>
  );
}

export default Cam;
