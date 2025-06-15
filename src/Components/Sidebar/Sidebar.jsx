import * as React from "react";
import { useRef, useState, useEffect } from "react";
import { motion, useCycle } from "framer-motion";
import { useDimensions } from "./use-dimensions";
import { MenuToggle } from "./MenuToggle";
import { Navigation } from "./Navigation";
import './Sidebar.css';
import ChartContainer from "../Charts/ChartContainer/ChartContainer";

const sidebar = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at calc(100% - 40px) 40px)`,
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2
    }
  }),
  closed: {
    clipPath: "circle(30px at calc(100% - 40px) 40px)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40
    }
  }
};

// Add variants for the resize handle
const resizeHandleVariants = {
  open: {
    opacity: 1,
    transition: {
      delay: 0.3, // Wait for the circular animation to be mostly complete
      duration: 0.2
    }
  },
  closed: {
    opacity: 0,
    transition: {
      duration: 0.1 // Quick fade out when closing starts
    }
  }
};

const DEFAULT_SIDEBAR_WIDTH = 300;
const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

export const Sidebar = ({markers}) => {
  const [isOpen, toggleOpen] = useCycle(false, true);
  const [isFullyOpen, setIsFullyOpen] = useState(false);
  const containerRef = useRef(null);
  const { height } = useDimensions(containerRef);
  
  // Initialize sidebar width from localStorage or use default
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth, 10) : DEFAULT_SIDEBAR_WIDTH;
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Save width to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Handle the animation completion
  const handleAnimationComplete = () => {
    if (isOpen) {
      setIsFullyOpen(true);
    } else {
      setIsFullyOpen(false);
    }
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaX = startXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(startWidthRef.current + deltaX, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      <motion.nav
        className="sidebar-nav"
        initial={false}
        animate={isOpen ? "open" : "closed"}
        custom={height}
        ref={containerRef}
        onAnimationComplete={handleAnimationComplete}
        style={{ width: sidebarWidth }}
      >
        <motion.div
          className="sidebar-background"
          variants={sidebar}
          initial={false}
          animate={isOpen ? "open" : "closed"}
          custom={height}
        >
          
          {/* Start charts  */}
          <div className="sidebar-charts-container">
            {isOpen && <ChartContainer markers={markers} />}
          </div>
          {/* End charts  */}

        </motion.div>
        <motion.div 
          className="sidebar-resize-handle"
          variants={resizeHandleVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          onMouseDown={handleMouseDown}
        />
        <MenuToggle toggle={() => toggleOpen()} />
      </motion.nav>
    </>
  );
};

export default Sidebar;
