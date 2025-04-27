import * as React from "react";
import { useRef } from "react";
import { motion, useCycle } from "framer-motion";
import { useDimensions } from "./use-dimensions";
import { MenuToggle } from "./MenuToggle";
import { Navigation } from "./Navigation";
import './Sidebar.css'; 

const sidebar = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at calc(100% - 40px) 40px)`, // Top-right corner
    
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2
    }
  }),
  closed: {
    clipPath: "circle(30px at calc(100% - 40px) 40px)", // Keep top-right alignment
    
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40
    }
  }
};



export const Sidebar = () => {
  const [isOpen, toggleOpen] = useCycle(false, true);  // <-- START closed!!
  const containerRef = useRef(null);
  const { height } = useDimensions(containerRef);

  return (
    <motion.nav
      className="sidebar-nav"
      initial={false} // Don't animate immediately
      animate={isOpen ? "open" : "closed"}
      custom={height}
      ref={containerRef}
    >
      <motion.div
        className="sidebar-background"
        variants={sidebar}
        initial={false}
        animate={isOpen ? "open" : "closed"}
        custom={height}
      >
        <Navigation isOpen={isOpen} />
      </motion.div>
      <MenuToggle toggle={() => toggleOpen()} />
    </motion.nav>
  );
};

export default Sidebar;
