
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 mobile-padding py-4 md:py-6 mobile-container">
          {children}
        </main>
      </div>
    </div>
  );
};
