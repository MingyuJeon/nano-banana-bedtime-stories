import { motion, Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.95
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.8,
      ease: [0.43, 0.13, 0.23, 0.96],
      staggerChildren: 0.2
    }
  },
};

function FairyIntro({ active }: { active: boolean }) {
  return (
    <motion.div
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="flex-col-center"
    >
      <div className="fairy-circle">
        <span className="fairy-icon">🧚‍♀️</span>
      </div>
      <h1 className="title-gradient">Banana Bedtime Story</h1>
      <p className="subtitle">Bedtime stories made just for you</p>
      
      {active && (
        <motion.div
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <span className="scroll-indicator-text">Scroll to continue</span>
          <div className="scroll-indicator-arrow"></div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default FairyIntro;
