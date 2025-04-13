import { useRef } from "react";

export default function UploadButton({ onFileSelect }) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <>
      <div onClick={handleClick}>
        <button className="bg-[#E78743] text-white px-4 py-4 rounded-[25px] font-bold hover:bg-[#D67632] transition-colors">Upload image or video</button>
      </div>
      <input
        type="file"
        accept="image/*,video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}