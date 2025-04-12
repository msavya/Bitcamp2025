export default function AddButton(props) {
  return (
    <div className="add-button w-[126px] h-[126px] flex items-center justify-center bg-[#D9D9D9] rounded-[15px]" onClick={props.onClick}>
        <img src = "plusIcon.png" className = "w-[50px] h-[50px]" alt = "add"/>
    </div>
  );
}
