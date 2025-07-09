
import React from 'react';
import { Calendar, FileText, Truck, CheckCircle, CreditCard, BarChart3 } from 'lucide-react';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/', active: true },
  { icon: Calendar, label: 'PPMP Module', path: '/ppmp' },
  { icon: FileText, label: 'Purchase Request', path: '/purchase-requests' },
  { icon: Truck, label: 'Purchase Order', path: '/purchase-orders' },
  { icon: CheckCircle, label: 'Inspection & Acceptance', path: '/iar' },
  { icon: CreditCard, label: 'Disbursement Voucher', path: '/dv' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <a
                  href={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
