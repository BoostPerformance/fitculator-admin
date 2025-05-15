interface CustomAlertProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const CustomAlert = ({
  message,
  isVisible,
  onClose,
}: CustomAlertProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 p-4 bg-white rounded-lg shadow-lg border border-green-500 animate-in fade-in slide-in-from-top-3 z-50">
      <div className="flex items-center gap-2">
        <div className="text-green-600">{message}</div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
