import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, FileText, Truck, CheckCircle, CreditCard, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'PPMP Module', path: '/ppmp' },
  { icon: FileText, label: 'Purchase Request', path: '/purchase-requests' },
  { icon: Truck, label: 'Purchase Order', path: '/purchase-orders' },
  { icon: CheckCircle, label: 'Inspection & Acceptance', path: '/inspection-reports' },
  { icon: CreditCard, label: 'Disbursement Voucher', path: '/disbursement-vouchers' },
];

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg z-40 overflow-y-auto">
            <nav className="p-4">
              <ul className="space-y-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={index}>
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  );
};