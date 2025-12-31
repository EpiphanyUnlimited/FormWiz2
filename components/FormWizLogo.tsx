import React from 'react';

interface FormWizLogoProps {
  size?: number;
  className?: string;
}

const FormWizLogo: React.FC<FormWizLogoProps> = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" /> {/* Blue-600 */}
          <stop offset="1" stopColor="#4F46E5" /> {/* Indigo-600 */}
        </linearGradient>
      </defs>
      
      {/* Document Shape */}
      <path 
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" 
        fill="url(#logoGradient)" 
        stroke="currentColor" 
        strokeWidth="0" // Using fill for main shape, stroke optionally via class
      />
      
      {/* Folded Corner */}
      <path 
        d="M14 2V8H20" 
        fill="#1E40AF" // Darker blue
        fillOpacity="0.3"
      />

      {/* Concave Diamond / AI Sparkle */}
      <path 
        d="M12 18L10.5 14.5L7 13L10.5 11.5L12 8L13.5 11.5L17 13L13.5 14.5L12 18Z" 
        fill="white"
        className="animate-pulse"
      />
    </svg>
  );
};

export default FormWizLogo;