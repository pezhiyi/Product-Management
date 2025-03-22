import { useState, useEffect } from 'react';

export default function Toast({ message, duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 300);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  return (
    <div className={`fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 ${
      visible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {message}
      </div>
    </div>
  );
} 