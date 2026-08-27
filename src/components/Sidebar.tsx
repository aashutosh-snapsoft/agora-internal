"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleExpandClick = useCallback(() => setIsExpanded(!isExpanded), [isExpanded]);

  return (
    <nav className={`bg-white border-r h-full flex flex-col transition-all duration-300 ${isExpanded ? 'w-64' : 'w-16'}`}>
      <div className="p-4 flex items-center">
        {isExpanded && (
          <>
            <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-xl">$</span>
            </div>
            <Link href="/" className="text-xl font-semibold">Socratics</Link>
          </>
        )}
        {!isExpanded && (
          <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">$</span>
          </div>
        )}
      </div>
      {isExpanded && <div className="px-4 py-2 text-gray-400 text-xs">Hi, Arthur.</div>}
      <div className="flex-grow">
        <SidebarItem href="/projects" icon={<FolderIcon />} label="Projects" isExpanded={isExpanded} />
        <SidebarItem href="/chat" icon={<ChatIcon />} label="Chat" isExpanded={isExpanded} />
        <SidebarItem href="/organization" icon={<TeamIcon />} label="Organization" isExpanded={isExpanded} />
        <SidebarItem href="/help" icon={<HelpIcon />} label="Help" isExpanded={isExpanded} />
      </div>
      <button
        onClick={handleExpandClick}
        className="p-4 flex items-center hover:bg-gray-100"
      >
        {isExpanded ? (
          <>
            <CollapseIcon />
            <span className="ml-3">Close</span>
          </>
        ) : (
          <ExpandIcon />
        )}
      </button>
    </nav>
  );
};

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon, label, isExpanded }) => {
  return (
    <Link href={href} className="flex items-center px-4 py-2 hover:bg-gray-100">
      {icon}
      {isExpanded && <span className="ml-3">{label}</span>}
    </Link>
  );
};

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const TeamIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const HelpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const CollapseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export default Sidebar;
