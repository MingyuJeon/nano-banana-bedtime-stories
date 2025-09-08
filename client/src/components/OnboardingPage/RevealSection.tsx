import { ReactNode, useState } from "react";
import { InView } from "react-intersection-observer";
import { motion } from "framer-motion";

interface RevealSectionProps {
  children: (opts: { in: boolean }) => ReactNode;
  rootMargin?: string;
  className?: string;
  threshold?: number;
}

function RevealSection({
  children,
  rootMargin = "-100px 0px",
  className = "",
  threshold = 0.1,
}: RevealSectionProps) {
  const [hasEntered, setHasEntered] = useState(false);
  
  return (
    <InView
      triggerOnce
      rootMargin={rootMargin}
      threshold={threshold}
      onChange={(inView) => {
        if (inView) setHasEntered(true);
      }}
    >
      {({ ref }) => (
        <motion.section 
          ref={ref} 
          className={`reveal-section ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: hasEntered ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {children({ in: hasEntered })}
        </motion.section>
      )}
    </InView>
  );
}

export default RevealSection;