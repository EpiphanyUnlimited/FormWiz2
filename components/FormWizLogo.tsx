import React from 'react';

interface FormWizLogoProps {
  size?: number;
  className?: string;
}

const FormWizLogo: React.FC<FormWizLogoProps> = ({ size = 24, className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Light Mode Logo (Hidden in Dark) */}
      <img
        src="/logo-dark.png"
        alt="FormWiz Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default FormWizLogo;