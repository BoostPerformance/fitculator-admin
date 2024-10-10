interface TextBoxProps {
  title: string;
  copyicon: string;
  inputbox: string;
  button1: string;
  button2?: string;
}

const TextBox = ({ title, copyicon, inputbox, button1, button2 }: any) => {
  return (
    <div className="mt-[2rem] p-[1rem] border rounded-md">
      <h4 className="text-[1rem] font-semibold mb-2 flex items-center">
        {title} <span className="ml-2 text-[1rem]">{copyicon}</span>
      </h4>
      <div className="flex flex-col items-end">
        <input
          type="text"
          placeholder={inputbox}
          className="border p-2 w-full rounded-md text-0.875-400"
        />
        <div className="flex gap-[1rem]">
          <button className="bg-[#FF9257] text-white px-4 py-[0.5rem] rounded-md  text-0.875-400 mt-[0.5rem]">
            {button1}
          </button>
          {button2 && (
            <button className="bg-[#48BA5D] text-white px-4 py-[0.5rem] rounded-md  text-0.875-400 mt-[0.5rem]">
              {button2}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextBox;
