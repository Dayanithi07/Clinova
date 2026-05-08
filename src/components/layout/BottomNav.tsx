import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FileText, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const navItems = [
    { name: 'Home', path: '/', icon: <LayoutDashboard size={24} /> },
    { name: 'AI', path: '/assistant', icon: <MessageSquare size={24} /> },
    { name: 'Records', path: '/records', icon: <FileText size={24} /> },
    { name: 'Reminders', path: '/reminders', icon: <Bell size={24} /> },
    { name: 'Profile', path: '/profile', icon: <User size={24} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center space-y-1 transition-colors duration-300 ${
              isActive ? 'text-primary-blue' : 'text-text-secondary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`${isActive ? 'bg-primary-light p-2 rounded-xl' : 'p-2'}`}
              >
                {item.icon}
              </motion.div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;
