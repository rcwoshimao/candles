import * as React from "react";
import { useRef } from "react";
import { motion, useCycle } from "framer-motion";
import { useDimensions } from "./use-dimensions";
import { MenuToggle } from "./MenuToggle";
import { Navigation } from "./Navigation";
import './Sidebar.css'; 

const sidebar = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at 40px 40px)`,
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2
    }
  }),
  closed: {
    clipPath: "circle(30px at 40px 40px)",
    transition: {
      delay: 0.5,
      type: "spring",
      stiffness: 400,
      damping: 40
    }
  }
};

export const Sidebar = () => {
  const [isOpen, toggleOpen] = useCycle(true, false);
  const containerRef = useRef(null);
  const { height } = useDimensions(containerRef);

  return (
    <motion.nav
    className="sidebar-nav"
    initial={false}
    animate={isOpen ? "open" : "closed"}
    custom={height}
    ref={containerRef}
  >
    <motion.div
      className="sidebar-background"
      variants={sidebar}
      animate={isOpen ? "open" : "closed"}
      initial={false}
      custom={height}
    >
      <Navigation />
      <MenuToggle toggle={() => toggleOpen()} />
    </motion.div>
  </motion.nav>
  


  );
};


export default Sidebar; 