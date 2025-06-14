import * as React from "react";
import { useRef, useState, useEffect } from "react";
import { motion, useCycle } from "framer-motion";
import { useDimensions } from "./use-dimensions";
import { MenuToggle } from "./MenuToggle";
import { Navigation } from "./Navigation";
import './Sidebar.css';

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

export const Sidebar = () => {
  const [isOpen, toggleOpen] = useCycle(false, true);
  const [isFullyOpen, setIsFullyOpen] = useState(false);
  const containerRef = useRef(null);
  const { height } = useDimensions(containerRef);
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

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
      const newWidth = Math.min(Math.max(startWidthRef.current + deltaX, 400), 800);
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
          <Navigation isOpen={isOpen} />
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
