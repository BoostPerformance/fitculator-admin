interface ModalProps {
  onClose: () => void;
}

export default function Modal({ onClose }: ModalProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-white rounded-lg p-6 w-[30rem] shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">코치메모</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <textarea
            className="w-full h-32 p-2 border border-gray-300 rounded-md resize-none"
            placeholder="메모를 남겨주세요!"
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-[3rem] py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              닫기
            </button>
            <button className="px-[3rem] py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              저장
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
