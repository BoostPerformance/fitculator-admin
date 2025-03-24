import React from 'react';

const FitnessTrackingUI = () => {
  return (
    <div className="flex w-full bg-gray-100 p-4">
      {/* Left Panel */}
      <div className="w-1/6 bg-white rounded-lg p-4 mr-2 shadow-sm">
        <div className="font-bold text-lg mb-6">FITCULATOR</div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">활동지</div>
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          <div className="pl-2 pt-2 text-sm">
            <div className="text-xs text-gray-500 mb-1">
              F&S 휘트니스 CSO 활동지
            </div>
            <div className="text-xs mb-1">전체</div>
            <div className="text-xs mb-1 text-blue-500">운동</div>
            <div className="text-xs">식단표</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-4/6 mr-2">
        {/* Top Performance Card */}
        <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <div className="mb-4">
            <div className="font-bold mb-1">최한 님의 운동현황</div>
            <div className="text-xs text-gray-500">오늘 목표 달성률</div>
          </div>

          <div className="flex items-center mb-8">
            <div className="text-3xl font-bold text-blue-500 mr-2">80</div>
            <div className="text-xl text-blue-500">%</div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: '80%' }}
            ></div>
          </div>

          <div className="mb-4">
            <div className="font-bold mb-4">주간운동 그래프</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="py-2 text-left">ID</th>
                  <th className="py-2 text-left">지점</th>
                  <th className="py-2 text-center">
                    1주차
                    <br />
                    (03.20~)
                  </th>
                  <th className="py-2 text-center">
                    2주차
                    <br />
                    (03.27~)
                  </th>
                  <th className="py-2 text-center">
                    3주차
                    <br />
                    (10.13~)
                  </th>
                  <th className="py-2 text-center">
                    4주차
                    <br />
                    (10.21~)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="py-4 text-left">
                    Ashly
                    <br />
                    ###227
                  </td>
                  <td className="py-4 text-left">영등포센터 휘트니</td>
                  <td className="py-4 text-center text-blue-500">100% / 1회</td>
                  <td className="py-4 text-center text-blue-500">100% / 2회</td>
                  <td className="py-4 text-center text-blue-500">100% / 2회</td>
                  <td className="py-4 text-center text-blue-500">90% / 1회</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* First Chart Panel */}
        <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <div className="font-bold mb-4">1주차 운동 그래프</div>

          <div className="flex mb-6">
            {/* Donut Chart */}
            <div className="w-1/3 relative">
              <div className="flex items-center justify-center">
                <svg className="w-40 h-40" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="white" />
                  {/* Blue section (40%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#60BDFF"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="169.62"
                  />
                  {/* Green section (38.2%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#90EFA5"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="103.24"
                    transform="rotate(115.2 50 50)"
                  />
                  {/* Purple section (9.8%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#9BA3FF"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="27.7"
                    transform="rotate(252.9 50 50)"
                  />
                </svg>
                <div className="absolute text-2xl font-bold">88%</div>
              </div>

              <div className="flex justify-around text-xs mt-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
                  <div>
                    HIT
                    <br />
                    40%
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-300 rounded-full mr-1"></div>
                  <div>
                    일반기기
                    <br />
                    38.2%
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-300 rounded-full mr-1"></div>
                  <div>
                    걷기
                    <br />
                    9.8%
                  </div>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="w-2/3 flex items-end pl-6">
              <div className="flex h-48 w-full items-end justify-between">
                <div className="flex flex-col items-center">
                  <div className="h-24 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">월</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-8 bg-red-400 mb-2"></div>
                  <div className="text-xs text-gray-500">화</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-10 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">수</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-36 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">목</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">금</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">토</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">일</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <div className="text-gray-500">전체 운동</div>
            <div className="text-blue-500">
              0<span className="text-gray-500">/2 회</span>
            </div>
          </div>
        </div>

        {/* Second Chart Panel (Duplicate of the first) */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="font-bold mb-4">1주차 운동 그래프</div>

          <div className="flex mb-6">
            {/* Donut Chart */}
            <div className="w-1/3 relative">
              <div className="flex items-center justify-center">
                <svg className="w-40 h-40" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="white" />
                  {/* Blue section (40%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#60BDFF"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="169.62"
                  />
                  {/* Green section (38.2%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#90EFA5"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="103.24"
                    transform="rotate(115.2 50 50)"
                  />
                  {/* Purple section (9.8%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#9BA3FF"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="27.7"
                    transform="rotate(252.9 50 50)"
                  />
                </svg>
                <div className="absolute text-2xl font-bold">88%</div>
              </div>

              <div className="flex justify-around text-xs mt-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
                  <div>
                    HIT
                    <br />
                    40%
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-300 rounded-full mr-1"></div>
                  <div>
                    일반기기
                    <br />
                    38.2%
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-300 rounded-full mr-1"></div>
                  <div>
                    걷기
                    <br />
                    9.8%
                  </div>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="w-2/3 flex items-end pl-6">
              <div className="flex h-48 w-full items-end justify-between">
                <div className="flex flex-col items-center">
                  <div className="h-24 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">월</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">화</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-10 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">수</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-40 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">목</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">금</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">토</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-8 bg-blue-400 mb-2"></div>
                  <div className="text-xs text-gray-500">일</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-sm mb-6">
            <div className="text-gray-500">전체 운동</div>
            <div className="text-blue-500">
              0<span className="text-gray-500">/2 회</span>
            </div>
          </div>

          <div className="flex items-center text-xs text-gray-500 mb-4">
            <div className="mr-2">코치 피드백</div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-auto text-gray-400">
              작성일시: 2023.10.24 14:15:34
            </div>
          </div>

          <div className="text-gray-400 text-xs mb-4">
            아직 피드백이 없습니다!
          </div>

          <div className="flex justify-end">
            <button className="bg-green-500 text-white rounded px-4 py-2 text-sm">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                피드백
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/6">
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="text-center text-gray-500 mb-4">
            <svg
              className="w-6 h-6 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </div>

          <div className="mb-4">
            <div className="font-medium mb-1">Lucy님의 운동현황</div>
            <div className="text-xs text-gray-500 mb-1">이번주 목표 달성률</div>
            <div className="text-xl font-bold text-blue-500 mb-2">80%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: '80%' }}
              ></div>
            </div>
          </div>

          {/* Small Weekly Table */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">주중 운동현황</div>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="py-1 text-left">요일</th>
                  <th className="py-1 text-right">달성률 / 횟수</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 text-gray-500">
                    1주차
                    <br />
                    (03.20~)
                  </td>
                  <td className="py-1 text-blue-500 text-right">100% / 1회</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-500">
                    2주차
                    <br />
                    (03.27~)
                  </td>
                  <td className="py-1 text-blue-500 text-right">100% / 1회</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-500">
                    3주차
                    <br />
                    (10.14~)
                  </td>
                  <td className="py-1 text-blue-500 text-right">100% / 1회</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-500">
                    4주차
                    <br />
                    (10.14~)
                  </td>
                  <td className="py-1 text-blue-500 text-right">100% / 1회</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mini Donut Chart */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">이번 주 운동현황</div>
            <div className="flex justify-center mb-2">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="white" />
                  {/* Blue section */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#60BDFF"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="169.62"
                  />
                  {/* Green section */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#90EFA5"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="103.24"
                    transform="rotate(115.2 50 50)"
                  />
                  {/* Purple section */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#9BA3FF"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="27.7"
                    transform="rotate(252.9 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                  88%
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <div className="text-gray-500">전체 운동</div>
              <div className="text-blue-500">
                0<span className="text-gray-500">/2회</span>
              </div>
            </div>
          </div>

          {/* Mini Bar Chart */}
          <div className="mb-6">
            <div className="h-24 flex items-end justify-between">
              <div className="flex flex-col items-center">
                <div className="h-20 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">월</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-8 w-4 bg-red-400 mb-1"></div>
                <div className="text-xs text-gray-500">화</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">수</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-20 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">목</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">금</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">토</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">일</div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div>
            <div className="text-sm font-medium mb-2">코치 피드백</div>
            <div className="text-xs text-gray-500 mb-2">
              코치님이 직접 운동현황 피드백을 남겨요
            </div>
            <textarea
              className="w-full border border-gray-200 rounded p-2 text-xs h-20 mb-2"
              placeholder="피드백을 작성해주세요."
            ></textarea>
            <div className="grid grid-cols-2 gap-2">
              <button className="border border-gray-300 rounded text-gray-500 py-1 text-xs">
                취소
              </button>
              <button className="bg-gray-300 rounded text-gray-500 py-1 text-xs">
                저장
              </button>
            </div>
          </div>
        </div>

        {/* Duplicate Right Panel Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">지난 주 운동현황</div>
            <div className="flex justify-center mb-2">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="white" />
                  {/* Blue section */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#60BDFF"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="169.62"
                  />
                  {/* Green section */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#90EFA5"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="103.24"
                    transform="rotate(115.2 50 50)"
                  />
                  {/* Purple section */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="#9BA3FF"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset="27.7"
                    transform="rotate(252.9 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                  88%
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <div className="text-gray-500">전체 운동</div>
              <div className="text-blue-500">
                0<span className="text-gray-500">/2회</span>
              </div>
            </div>
          </div>

          {/* Mini Bar Chart */}
          <div className="mb-6">
            <div className="h-24 flex items-end justify-between">
              <div className="flex flex-col items-center">
                <div className="h-20 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">월</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-8 w-4 bg-red-400 mb-1"></div>
                <div className="text-xs text-gray-500">화</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">수</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-20 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">목</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">금</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">토</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-4 bg-blue-400 mb-1"></div>
                <div className="text-xs text-gray-500">일</div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div>
            <div className="text-sm font-medium mb-2">코치 피드백</div>
            <div className="text-xs text-gray-500 mb-2">
              코치님이 직접 운동현황 피드백을 남겨요
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessTrackingUI;
