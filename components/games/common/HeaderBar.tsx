import React from 'react';

interface HeaderBarProps {
  fixedHeight?: boolean;
  title?: string;
  children?: React.ReactNode;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ 
  fixedHeight = false, 
  title = "Par/Impar",
  children 
}) => {
  return (
    <div className={`w-full bg-white border-b border-gray-200 ${fixedHeight ? 'h-16' : 'min-h-16'} flex items-center justify-between px-4`}>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default HeaderBar;
