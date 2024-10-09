'use client';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { useState } from 'react';

const DateInput = () => {
  const [selected, setSelected] = useState<Date>();
  const [open, setOpen] = useState(false);

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formattedDate = formatDate(selected);

  const Datetoday = new Date().toISOString().split('T')[0];

  const handleDateOpen = () => {
    setOpen(!open);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelected(date);
    setOpen(false); // 날짜 선택 후 데이트피커 닫기
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={formattedDate}
        onClick={handleDateOpen}
        placeholder={Datetoday}
        readOnly
        className="border-[0.1rem] py-[0.4rem] px-[1rem] rounded-[0.5rem] w-[15rem]"
      />
      {open && (
        <div className="absolute z-10 mt-2 bg-white p-[1rem] rounded-[1rem] drop-shadow">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDateChange}
          />
        </div>
      )}
    </div>
  );
};

export default DateInput;
