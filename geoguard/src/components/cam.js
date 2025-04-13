import React, { useState } from "react";
import 'ldrs/lineSpinner'

function Cam() {
  // fix loading logic after implementing camera
  const [loaded, setLoaded] = useState(false);

  return (
    <div>
      {!loaded && <l-lineSpinner size='60' color="coral"></l-lineSpinner>}
      {/* <p className="text-center">Loading camera...</p> */}
      {/* INSERT CAMERA STUFF HERE */}
    </div>
  );
}

export default Cam;
