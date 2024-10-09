const DateInput = () => {
  return (
    <div className="mt-4">
      <input
        type="date"
        className="border border-gray-300 p-2 rounded-md"
        defaultValue={new Date().toISOString().split('T')[0]}
      />
    </div>
  );
};

export default DateInput;
