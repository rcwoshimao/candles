import * as React from "react";
import { motion } from "framer-motion";
import './Sidebar.css'; 

const variants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 }
    }
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 }
    }
  }
};

const colors = ["#FF008C", "#D309E1", "#9C1AFF", "#7700FF", "#4400FF"];

export const MenuItem = ({ i }) => {
  return (
    <motion.li
      className="sidebar-li"
      variants={variants}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="sidebar-icon-placeholder" data-color-index={i} />
      <div className="sidebar-text-placeholder" data-color-index={i} />
    </motion.li>
  );
};
