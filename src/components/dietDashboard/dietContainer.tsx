// 'use client';
// import React, { useState } from 'react';
// import DateInput from '../input/dateInput';
// import SearchInput from '../input/searchInput';
// import DietTable from './dietTable';
// //import { AI_Feedback, Diet_Feedback } from '@/components/mock/DietItems';
// //import { CombinedData, Meal, Feedback, User } from '@/types/dietTypes';

// // 날짜를 'YYYY-MM-DD' 형식으로 변환하는 함수
// // const formatDate = (date: Date) => {
// //   const year = date.getFullYear();
// //   const month = String(date.getMonth() + 1).padStart(2, '0');
// //   const day = String(date.getDate()).padStart(2, '0');
// //   return `${year}-${month}-${day}`;
// // };

// export default function DietContainer() {
//   const [selectedDate, setSelectedDate] = useState();
//   const handleDateInput = (e: string) => {
//     setSelectedDate(e);
//     console.log(e);
//   };
//   return (
//     <div className="flex-1 p-6 bg-gray-100 pt-[7rem] bg-white-1">
//       <div className="flex justify-between items-center mt-[1.5rem]">
//         <DateInput
//           onChange={() => handleDateInput}
//           selectedDate={selectedDate}
//         />
//         <SearchInput />
//       </div>
//       <DietTable data={filteredData} />
//     </div>
//   );
// }
