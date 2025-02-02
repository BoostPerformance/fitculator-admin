'use client';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { useState } from 'react';
import Image from 'next/image';

interface DateInputProps {
  onChange: (date: string) => void;
  selectedDate: string | undefined;
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
      const formatted = formatDate(date);
      onChange(formatted);
      setOpen(false);
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
        className="border-[0.1rem] py-[0.4rem] pl-[2.5rem] rounded-[0.5rem] w-[15rem] sm:w-[10rem] dark:bg-gray-3 dark:text-black"
      />
      <Image
        src="/svg/arrow-right.svg"
        alt="calender"
        width={20}
        height={20}
        className="absolute left-[13rem] top-[0.6rem]"
      />
      {open && (
        <div className="absolute z-10 mt-2 bg-white dark:bg-gray-3 dark:text-black p-[1rem] rounded-[1rem] drop-shadow">
          <DayPicker
            mode="single"
            required={false}
            selected={selected}
            onSelect={handleDateChange}
          />
        </div>
      )}
    </div>
  );
};

export default DateInput;
