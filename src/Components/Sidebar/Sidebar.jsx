import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, X } from 'lucide-react'; // you can use any icon set

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      {!isOpen ? (
        <button
          className="p-2 bg-white text-black rounded shadow hover:bg-gray-100"
          onClick={() => setIsOpen(true)}
        >
          <BarChart3 className="w-6 h-6" />
        </button>
      ) : (
        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          exit={{ x: 300 }}
          className="w-72 bg-white rounded-xl shadow-xl p-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Visualizations</h2>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            {/* Replace below with actual charts */}
            <p className="text-sm text-gray-600">Insert charts here</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Sidebar;
