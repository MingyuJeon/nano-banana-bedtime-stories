import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import useTyping from "./useTyping";
import ReaderForm from "./ReaderForm";
import MoodPicker from "./MoodPicker";
import NarratorRegisterOnboarding from "./NarratorRegisterOnboarding";
import "./StickyScrollOnboarding.css";

interface StickyScrollOnboardingProps {
  onComplete: () => void;
}

function StickyScrollOnboarding({ onComplete }: StickyScrollOnboardingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Transform values based on scroll progress
  const fairyScale = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [1, 1.1, 1, 1.1, 1, 1.1]);
  
  // Background gradient based on scroll
  const bgColor1 = useTransform(scrollYProgress, [0, 0.5, 1], ["#faf5ff", "#fdf2f8", "#dbeafe"]);
  const bgColor2 = useTransform(scrollYProgress, [0, 0.5, 1], ["#fdf2f8", "#dbeafe", "#faf5ff"]);

  // Text animations
  const text1Active = useTransform(scrollYProgress, [0, 0.15, 0.25], [0, 1, 0]);
  const text2Active = useTransform(scrollYProgress, [0.15, 0.35, 0.45], [0, 1, 0]);
  const formActive = useTransform(scrollYProgress, [0.25, 0.4, 0.5], [0, 1, 0]);
  const text3Active = useTransform(scrollYProgress, [0.4, 0.55, 0.65], [0, 1, 0]);
  const moodActive = useTransform(scrollYProgress, [0.55, 0.7, 0.8], [0, 1, 0]);
  const narratorActive = useTransform(scrollYProgress, [0.7, 0.85, 1], [0, 1, 1]);

  useEffect(() => {
    // Add class to body for proper scrolling
    document.body.classList.add('onboarding-active');
    
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const section = Math.floor(latest * 6);
      setCurrentSection(section);
    });
    
    return () => {
      unsubscribe();
      document.body.classList.remove('onboarding-active');
    };
  }, [scrollYProgress]);

  const showText1 = currentSection >= 0;
  const showText2 = currentSection >= 1;
  const showText3 = currentSection >= 3;

  const text1 = useTyping("Tell me about you", showText1, 30);
  const text2 = useTyping("How you feel today?", showText3, 30);

  return (
    <>
      {/* Animated Background */}
      <motion.div
        className="sticky-background"
        style={{
          background: useTransform(
            [bgColor1, bgColor2],
            ([c1, c2]) => `linear-gradient(to bottom, ${c1}, ${c2})`
          ),
        }}
      />

      {/* Fixed Top Fairy */}
      <div className="sticky-fairy-container">
        <motion.div
          className="sticky-fairy"
          style={{
            scale: fairyScale,
          }}
        >
          <div className="fairy-circle-sticky">
            <span className="fairy-icon">🧚‍♀️</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="sticky-title"
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0.3]),
          }}
        >
          Banana Bedtime Story
        </motion.h1>

        {/* Speech Bubbles */}
        {showText1 && (
          <motion.div
            className="speech-bubble-sticky"
            style={{ opacity: text1Active }}
          >
            <p className="speech-text">{text1}</p>
          </motion.div>
        )}

        {showText2 && (
          <motion.div
            className="speech-bubble-sticky"
            style={{ opacity: text3Active }}
          >
            <p className="speech-text">{text2}</p>
          </motion.div>
        )}
      </div>

      {/* Scroll Content Below Fairy */}
      <div ref={containerRef} className="scroll-content">
        <div className="scroll-section intro-section" />
        
        <motion.div 
          className="scroll-section content-section"
          style={{ opacity: formActive }}
        >
          <ReaderForm active={currentSection === 2} />
        </motion.div>

        <div className="scroll-section spacer-section" />

        <motion.div 
          className="scroll-section content-section"
          style={{ opacity: moodActive }}
        >
          <MoodPicker active={currentSection === 4} />
        </motion.div>

        <motion.div 
          className="scroll-section content-section"
          style={{ opacity: narratorActive }}
        >
          <NarratorRegisterOnboarding active={currentSection === 5} />
        </motion.div>

        <div className="scroll-section final-section">
          <button className="cta-button" onClick={onComplete}>
            ✨ Create My Story ✨
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <motion.div 
        className="progress-bar"
        style={{
          scaleX: scrollYProgress,
        }}
      />
    </>
  );
}

export default StickyScrollOnboarding;