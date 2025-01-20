'use client';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { useState } from 'react';
import Image from 'next/image';

interface DateInputProps {
  onChange: (date: string) => void; // 수정: date 타입을 string으로 변경
  selectedDate: string | undefined; // 선택된 날짜를 전달받음
}

const DateInput = ({ onChange, selectedDate }: DateInputProps) => {
  const [selected, setSelected] = useState<Date>();
  const [open, setOpen] = useState(false);

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formattedDate = formatDate(selected);

  const Datetoday = new Date().toISOString().split('T')[0];

  const handleDateOpen = () => {
    setOpen(!open);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelected(date || undefined);
    if (date) {
      const formatted = formatDate(date); // 수정: 날짜를 포맷하여 전달
      onChange(formatted);
      setOpen(false);
      console.log(formatted); // 포맷된 날짜 확인용
    }
  };

  return (
    <div className="relative ">
      <Image
        src="/svg/calender.svg"
        alt="calender"
        width={20}
        height={20}
        className="absolute left-[0.5rem] top-[0.6rem]"
      />
      <input
        type="text"
        value={formattedDate || selectedDate}
        onClick={handleDateOpen}
        placeholder={Datetoday}
        readOnly
        className="border-[0.1rem] py-[0.4rem] pl-[2.5rem] rounded-[0.5rem] w-[15rem] dark:bg-gray-3 dark:text-black"
      />
      <Image
        src="/svg/arrow-right.svg"
        alt="calender"
        width={20}
        height={20}
        className="absolute right-[0.5rem] top-[0.6rem]"
      />
      {open && (
        <div className="absolute z-10 mt-2 bg-white dark:bg-gray-3 dark:text-black p-[1rem] rounded-[1rem] drop-shadow">
          <DayPicker
            mode="single"
            required={false}
            selected={selected || new Date(selectedDate)}
            onSelect={handleDateChange}
          />
        </div>
      )}
    </div>
  );
};

export default DateInput;
