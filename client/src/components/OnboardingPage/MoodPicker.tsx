import { motion, Variants } from "framer-motion";
import { useState } from "react";

const fadeUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.95
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.8,
      ease: "easeOut",
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.8
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const MOODS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "brave", label: "Brave", emoji: "💪" },
  { id: "sleepy", label: "Sleepy", emoji: "😴" },
  { id: "curious", label: "Curious", emoji: "🤔" },
  { id: "silly", label: "Silly", emoji: "🤪" },
  { id: "calm", label: "Calm", emoji: "😌" },
] as const;

function MoodPicker({ active }: { active: boolean }) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  return (
    <motion.div
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="form-card"
      style={{ maxWidth: '42rem' }}
      role="group"
      aria-label="Select your mood"
    >
      <h2 className="form-title">How are you feeling?</h2>
      
      <motion.div 
        className="mood-grid"
        variants={fadeUp}
        initial="hidden"
        animate={active ? "show" : "hidden"}
      >
        {MOODS.map((mood) => (
          <motion.button
            variants={itemVariants}
            key={mood.id}
            className={`mood-button ${selectedMood === mood.id ? 'selected' : ''}`}
            type="button"
            aria-pressed={selectedMood === mood.id}
            onClick={() => setSelectedMood(mood.id)}
          >
            <span className="mood-emoji">{mood.emoji}</span>
            <span className="mood-label">{mood.label}</span>
            {selectedMood === mood.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mood-check"
              >
                <svg style={{ width: '1rem', height: '1rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </motion.div>
      
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mood-success"
        >
          <p>
            ✨ Great choice! Your stories will match your {MOODS.find(m => m.id === selectedMood)?.label.toLowerCase()} mood!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default MoodPicker;