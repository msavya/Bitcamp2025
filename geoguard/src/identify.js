import AddButton from "./components/addButton";
import PictureView from "./components/pictureView";
import EmptyView from "./components/emptyView";
function Identify() {
  return (
    <>
      <div className="body bg-custom-bg bg-cover bg-center min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl flex justify-center">
          <img
            src="rushmore.jpg"
            alt="Uploaded"
            className="h-96 w-auto object-contain rounded-2xl shadow-lg border border-gray-300"
          />
        </div>
        <button className = "bg-[#E78743] hover:bg-blue-700 rounded-full text-black text-2xl font-bold py-2 px-10 rounded mt-[30px] ">Download</button>
        <div className = "flex flex-row mt-[30px] gap-[15px] items-center justify-center">
          <AddButton />
          <PictureView />
          <EmptyView />
          <EmptyView />
          <EmptyView />
          <EmptyView />
          <EmptyView />
          <EmptyView />
          <EmptyView />
          <img src = "trash.png" className = "w-[40px] h-[40px]" alt = "add"/>
          
        
        </div>
      </div>
    </>
  );
}

export default Identify;
