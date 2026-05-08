import React from 'react';
import { Search, Bell, Menu, User } from 'lucide-react';
import { motion } from 'framer-motion';

const TopNavbar = () => {
  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center md:hidden">
        <button className="p-2 text-text-secondary hover:text-primary-blue transition-colors">
          <Menu size={24} />
        </button>
      </div>

      <div className="hidden md:flex flex-col">
        <h1 className="text-xl font-bold text-text-primary">Good Morning, Alex 👋</h1>
        <p className="text-sm text-text-secondary">Here's your health summary for today.</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search reports, medicines..."
            className="input-field pl-10 py-2 w-64 bg-surface-bg border-none focus:bg-white"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="relative p-2 text-text-secondary hover:text-primary-blue transition-colors bg-surface-bg rounded-full"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </motion.button>

        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center border-2 border-white shadow-sm cursor-pointer hover:shadow-md transition-all">
          <User size={20} className="text-primary-blue" />
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;
