import { useRef } from "react";

export default function AddButton({ onFileSelect }) {
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
      <div
        className="add-button w-[126px] h-[126px] flex items-center justify-center bg-[#D9D9D9] rounded-[15px] cursor-pointer"
        onClick={handleClick}
      >
        <img
          src="plusIcon.png"
          className="w-[50px] h-[50px]"
          alt="add"
        />
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
