export default function PictureView({ picture, onDelete, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      className={`relative w-[126px] h-[126px] flex items-center justify-center rounded-[15px] overflow-hidden transition-colors duration-150 cursor-pointer
        ${isActive ? "border-2 border-[#E78743]" : "hover:border-2 hover:border-[#E78743]"}`}
    >
      <img
        src={picture}
        alt="Uploaded"
        className="w-full h-full object-cover"
      />

      {/* Black transparent overlay that stays after click */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-150 ${
          isActive ? "opacity-20" : "opacity-0"
        }`}
      />

      {/* Trash Icon to delete */}
      <img
        src="trash.png"
        className="absolute top-2 right-2 w-6 h-6 cursor-pointer"
        alt="delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      />
    </div>
  );
}
