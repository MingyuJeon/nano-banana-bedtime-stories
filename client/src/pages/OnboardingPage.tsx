import { useEffect, useState } from "react";
import { InView } from "react-intersection-observer";
import { motion, Variants } from "framer-motion";
import "./OnboardingPage.css";

/** 공통: 섹션 래퍼 — 뷰포트에 들어오면 once=true로 애니메이션 트리거 */
function RevealSection({
  children,
  rootMargin = "-10% 0px",
  className = "",
}: {
  children: (opts: { in: boolean }) => React.ReactNode;
  rootMargin?: string;
  className?: string;
}) {
  const [hasEntered, setHasEntered] = useState(false);
  return (
    <InView
      triggerOnce
      rootMargin={rootMargin}
      onChange={(inView) => {
        if (inView) setHasEntered(true);
      }}
    >
      {({ ref }) => (
        <section ref={ref} className={`section ${className}`}>
          {children({ in: hasEntered })}
        </section>
      )}
    </InView>
  );
}

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

/** 공통: 페이드+슬라이드 인 */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

/** 1. 요정 등장 */
function FairyIntro({ active }: { active: boolean }) {
  return (
    <motion.div
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="flex-col-center"
    >
      <div className="fairy" aria-hidden />
      <h1 className="title">Banana Tales</h1>
      <p className="subtitle">Bedtime stories made just for you</p>
    </motion.div>
  );
}

/** 2. 요정 말풍선 + 타이핑: "Tell me about you" */
function FairyAskAboutYou({ active }: { active: boolean }) {
  const typed = useTyping("Tell me about you", active, 24);
  return (
    <motion.div
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="flex-col-center"
    >
      <div className="fairy" aria-hidden />
      <div className="bubble">{typed}</div>
    </motion.div>
  );
}

/** 3. 독자 정보 입력란 */
function ReaderForm({ active, onSubmit }: { active: boolean; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.form
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="card"
      onSubmit={handleSubmit}
    >
      <label className="label">
        Name
        <input 
          className="input" 
          name="name" 
          placeholder="e.g. Aiden"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
        />
      </label>
      <label className="label">
        Gender
        <select 
          className="input" 
          name="gender"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
      <button className="button" type="submit">
        Save
      </button>
    </motion.form>
  );
}

/** 4. 다시 요정: "How you feel today?" */
function FairyAskMood({ active }: { active: boolean }) {
  const typed = useTyping("How you feel today?", active, 24);
  return (
    <motion.div
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="flex-col-center"
    >
      <div className="fairy" aria-hidden />
      <div className="bubble">{typed}</div>
    </motion.div>
  );
}

/** 5. Mood 선택 (예시: 기본 버튼) */
const MOODS = ["Happy", "Brave", "Sleepy", "Curious", "Silly"] as const;
function MoodPicker({ active, onSelect }: { active: boolean; onSelect: (mood: string) => void }) {
  const [selectedMood, setSelectedMood] = useState("");

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    onSelect(mood);
  };

  return (
    <motion.div
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="card grid"
      role="group"
      aria-label="Select your mood"
    >
      {MOODS.map((m) => (
        <button 
          key={m} 
          className={`chip ${selectedMood === m ? 'selected' : ''}`}
          type="button" 
          aria-pressed={selectedMood === m}
          onClick={() => handleMoodSelect(m)}
        >
          {m}
        </button>
      ))}
    </motion.div>
  );
}

/** 6. 나레이터 등록(파일 업로드 or URL) */
function NarratorRegister({ active, onSubmit }: { active: boolean; onSubmit: (data: any) => void }) {
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [ttsId, setTtsId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ voiceFile, ttsId });
  };

  return (
    <motion.form
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="card"
      onSubmit={handleSubmit}
    >
      <h3 className="card-title">Narrator Voice</h3>
      <label className="label">
        Upload voice sample
        <input 
          className="input" 
          type="file" 
          accept="audio/*"
          onChange={(e) => setVoiceFile(e.target.files?.[0] || null)}
        />
      </label>
      <div className="or">or</div>
      <label className="label">
        TTS Voice ID (e.g., ElevenLabs)
        <input
          className="input"
          name="ttsId"
          placeholder="21m00Tcm4TlvDq8ikWAM"
          value={ttsId}
          onChange={(e) => setTtsId(e.target.value)}
        />
      </label>
      <button className="button" type="submit">
        Register
      </button>
    </motion.form>
  );
}

export default function OnboardingPage({ onComplete }: { onComplete: (data: any) => void }) {
  const [userData, setUserData] = useState<any>({});

  const handleReaderSubmit = (data: any) => {
    setUserData((prev: any) => ({ ...prev, ...data }));
  };

  const handleMoodSelect = (mood: string) => {
    setUserData((prev: any) => ({ ...prev, mood }));
  };

  const handleNarratorSubmit = (data: any) => {
    const completeData = { ...userData, ...data };
    onComplete(completeData);
  };

  return (
    <main>
      {/* 1. 요정 이미지 화면에 등장 */}
      <RevealSection>
        {({ in: ok }) => <FairyIntro active={ok} />}
      </RevealSection>

      {/* 2. 요정 말풍선(타이핑) */}
      <RevealSection>
        {({ in: ok }) => <FairyAskAboutYou active={ok} />}
      </RevealSection>

      {/* 3. 독자 정보 입력란 */}
      <RevealSection>
        {({ in: ok }) => <ReaderForm active={ok} onSubmit={handleReaderSubmit} />}
      </RevealSection>

      {/* 4. 다시 요정(타이핑) */}
      <RevealSection>
        {({ in: ok }) => <FairyAskMood active={ok} />}
      </RevealSection>

      {/* 5. Mood 선택 */}
      <RevealSection>
        {({ in: ok }) => <MoodPicker active={ok} onSelect={handleMoodSelect} />}
      </RevealSection>

      {/* 6. 나레이터 등록 */}
      <RevealSection>
        {({ in: ok }) => <NarratorRegister active={ok} onSubmit={handleNarratorSubmit} />}
      </RevealSection>
    </main>
  );
}