export default function ConfirmBlur({ onConfirm, onCancel }) {
  return (
    <div className="w-[360px] bg-[#F7EADB] rounded-2xl shadow-lg flex flex-col items-center justify-center p-6 border border-[#E78743]">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center leading-snug">
        Are you sure you want to blur this portion?
      </h2>

      <div className="flex flex-row items-center justify-center gap-4 w-full">
        <button
          onClick={onConfirm}
          className="
            bg-[#E78743] hover:bg-[#D67632] 
            text-white font-semibold 
            py-2.5 px-6 
            rounded-full 
            shadow-md 
            transition-all 
            duration-200
            focus:outline-none focus:ring-2 focus:ring-[#E78743] focus:ring-opacity-50
            active:scale-95
          "
        >
          Yes, Blur It
        </button>

        <button
          onClick={onCancel}
          className="
            bg-transparent hover:bg-gray-200 
            text-gray-700 font-semibold 
            py-2.5 px-6 
            rounded-full 
            border border-gray-400
            transition-all 
            duration-200
            focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50
            active:scale-95
          "
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
