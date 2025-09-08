import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import "./OnboardingPage.css";

/** 가벼운 타이핑 훅 */
function useTyping(text: string, start: boolean, cps = 20) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!start) return;
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, Math.max(10, 1000 / cps));
    return () => clearInterval(id);
  }, [text, start, cps]);
  return out;
}

const MOODS = ["Happy", "Brave", "Sleepy", "Curious", "Silly"] as const;

export default function OnboardingPage({
  onComplete,
}: {
  onComplete: (data: any) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    mood: "",
    voiceFile: null as File | null,
    ttsId: "",
  });

  const { scrollYProgress } = useScroll();

  // 타이핑 텍스트 - Hook은 항상 호출되어야 함
  const askAboutYouText = useTyping("Tell me about you", currentStep >= 1, 24);
  const askMoodText = useTyping("How you feel today?", currentStep >= 3, 24);

  // 스크롤 진행도를 스텝으로 변환 (0-6 단계)
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const step = Math.floor(latest * 6);
      setCurrentStep(step);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const completeData = { ...formData };
    onComplete(completeData);
  };

  // 각 단계별 opacity 계산
  const titleOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const subtitleOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const askAboutYouOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.2, 0.3, 0.4],
    [0, 1, 1, 0]
  );
  const readerFormOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.4, 0.5, 0.6],
    [0, 1, 1, 0]
  );
  const askMoodOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.6, 0.7, 0.8],
    [0, 1, 1, 0]
  );
  const moodPickerOpacity = useTransform(
    scrollYProgress,
    [0.7, 0.8, 0.9, 1],
    [0, 1, 1, 1]
  );
  const narratorOpacity = useTransform(
    scrollYProgress,
    [0.85, 0.95, 1],
    [0, 1, 1]
  );

  return (
    <div className="onboarding-container">
      {/* 스크롤 가능한 영역 (투명) */}
      <div className="scroll-container">
        <div className="scroll-section" />
        <div className="scroll-section" />
        <div className="scroll-section" />
        <div className="scroll-section" />
        <div className="scroll-section" />
        <div className="scroll-section" />
      </div>

      {/* 고정된 컨텐츠 영역 */}
      <div className="fixed-content">
        {/* 요정은 항상 표시 */}
        <motion.div
          className="fairy"
          aria-hidden
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Title & Subtitle - 처음에만 보임 */}
        <motion.h1 className="title" style={{ opacity: titleOpacity }}>
          Banana Bedtime Stories
        </motion.h1>
        <motion.p className="subtitle" style={{ opacity: subtitleOpacity }}>
          Bedtime stories made just for you
        </motion.p>

        {/* Ask About You - 두번째 단계 */}
        <motion.div className="bubble" style={{ opacity: askAboutYouOpacity }}>
          {askAboutYouText}
        </motion.div>

        {/* Reader Form - 세번째 단계 */}
        <motion.form
          className="card"
          style={{ opacity: readerFormOpacity }}
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="label">
            Name
            <input
              className="input"
              name="name"
              placeholder="e.g. Aiden"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </label>
          <label className="label">
            Age
            <input
              className="input"
              type="number"
              name="age"
              min={0}
              max={120}
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
            />
          </label>
          <label className="label">
            Gender
            <select
              className="input"
              name="gender"
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
            >
              <option value="" disabled>
                Select…
              </option>
              <option value="girl">Girl</option>
              <option value="boy">Boy</option>
              <option value="nonbinary">Non-binary</option>
              <option value="prefer-not">Prefer not to say</option>
            </select>
          </label>
        </motion.form>

        {/* Ask Mood - 네번째 단계 */}
        <motion.div className="bubble" style={{ opacity: askMoodOpacity }}>
          {askMoodText}
        </motion.div>

        {/* Mood Picker - 다섯번째 단계 */}
        <motion.div
          className="card grid"
          style={{ opacity: moodPickerOpacity }}
          role="group"
          aria-label="Select your mood"
        >
          {MOODS.map((m) => (
            <button
              key={m}
              className={`chip ${formData.mood === m ? "selected" : ""}`}
              type="button"
              aria-pressed={formData.mood === m}
              onClick={() => setFormData({ ...formData, mood: m })}
            >
              {m}
            </button>
          ))}
        </motion.div>

        {/* Narrator Register - 여섯번째 단계 */}
        <motion.form
          className="card narrator-card"
          style={{ opacity: narratorOpacity }}
          onSubmit={handleSubmit}
        >
          <h3 className="card-title">Narrator Voice</h3>
          <label className="label">
            Upload voice sample
            <input
              className="input"
              type="file"
              accept="audio/*"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  voiceFile: e.target.files?.[0] || null,
                })
              }
            />
          </label>
          <div className="or">or</div>
          <label className="label">
            TTS Voice ID (e.g., ElevenLabs)
            <input
              className="input"
              name="ttsId"
              placeholder="21m00Tcm4TlvDq8ikWAM"
              value={formData.ttsId}
              onChange={(e) =>
                setFormData({ ...formData, ttsId: e.target.value })
              }
            />
          </label>
          <button className="button" type="submit">
            Start Story
          </button>
        </motion.form>
      </div>
    </div>
  );
}
