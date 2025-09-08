import { motion, Variants } from "framer-motion";
import useTyping from "./useTyping";

const fadeUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.9
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.8,
      ease: "easeOut",
      delay: 0.2
    }
  },
};

function FairyAskMood({ active }: { active: boolean }) {
  const typed = useTyping("How you feel today?", active, 24);
  
  return (
    <motion.div
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="flex-col-center"
    >
      <div className="fairy-circle fairy-pulse">
        <span className="fairy-icon">🧚‍♀️</span>
      </div>
      <div className="speech-bubble">
        <p className="speech-text">{typed}</p>
      </div>
    </motion.div>
  );
}

export default FairyAskMood;