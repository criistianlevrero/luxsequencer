
import React, { useState } from 'react';
import { ChevronDownIcon } from './icons';

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="divide-y divide-gray-700">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-lg font-semibold text-gray-100 hover:text-cyan-400 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-6 space-y-6 pt-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
