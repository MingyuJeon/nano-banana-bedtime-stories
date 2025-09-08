<!-- # Web App Features for Storybook Reading

1. User Image Upload
   Users can upload their own image.
2. User Age and Gender Input
   Users provide their age and gender information.
3. Optional Voice Upload
   Users can upload a voice file to be used for narration (optional).
4. Personalized Story Generation using Gemini pro 2.5
   The system generates a fairy tale with the user as the main character, adapting the story to the user’s age and gender. Both images and text for the story are generated separately.
5. Background Music Generation from Images
   The app analyzes the generated images and creates suitable background music.
6. Read-Aloud Playback
   When the “Read” button is clicked, the app plays the narration voice (either uploaded, it should be generated via Elevenlabs API and played) along with the background music. -->

# User Flow

IntersectionObserver(react-intersection-observer) + Framer Motion 조합으로 "스크롤 트리거 애니메이션(Scroll-triggered animation / Scroll Reveal)"으로 구현. 아래 예시는 순서대로 섹션이 뷰포트에 들어올 때마다 요정/텍스트/입력란이 등장하고,말풍선은 타이핑 애니메이션으로 출력되는 예시 코드이다.

1. 요정 이미지 화면에 등장
2. 요정 말풍선에 "Tell me about you" 출력 (타이핑 애니메이션)
3. 화면에 독자 정보 입력란 등장 (이름, 나이, 성별)
4. 다시 요정 등장 "How you feel today?"
5. 화면에 Mood 선택란 등장
6. 나레이터 등록란 등장

## 핵심 아이디어(왜 이렇게 하는가)

- Intersection Observer: 각 섹션이 뷰포트에 들어오는 순간을 정확히 감지해 “한 번만” 애니메이션을 시작.
- Framer Motion: 등장/페이드/슬라이드 같은 모션을 선언형으로 관리(variants + whileInView/animate).
- 타이핑 애니메이션: 텍스트 길이에 따라 문자를 점진적으로 출력하는 가벼운 커스텀 훅으로 제어.
- 섹션 단위 설계: 각 단계를 풀스크린 섹션으로 쪼개면 ADHD 친화적으로 “한 번에 한 가지”에 집중 가능.

```ts
import { useEffect, useMemo, useState } from "react";
import { InView } from "react-intersection-observer";
import { motion, Variants } from "framer-motion";
import "./styles.css";

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
function ReaderForm({ active }: { active: boolean }) {
  return (
    <motion.form
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="card"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="label">
        Name
        <input className="input" name="name" placeholder="e.g. Aiden" />
      </label>
      <label className="label">
        Age
        <input className="input" type="number" name="age" min={0} max={120} />
      </label>
      <label className="label">
        Gender
        <select className="input" name="gender" defaultValue="">
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
function MoodPicker({ active }: { active: boolean }) {
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
        <button key={m} className="chip" type="button" aria-pressed="false">
          {m}
        </button>
      ))}
    </motion.div>
  );
}

/** 6. 나레이터 등록(파일 업로드 or URL) */
function NarratorRegister({ active }: { active: boolean }) {
  return (
    <motion.form
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="card"
      onSubmit={(e) => e.preventDefault()}
    >
      <h3 className="card-title">Narrator Voice</h3>
      <label className="label">
        Upload voice sample
        <input className="input" type="file" accept="audio/*" />
      </label>
      <div className="or">or</div>
      <label className="label">
        TTS Voice ID (e.g., ElevenLabs)
        <input
          className="input"
          name="ttsId"
          placeholder="21m00Tcm4TlvDq8ikWAM"
        />
      </label>
      <button className="button" type="submit">
        Register
      </button>
    </motion.form>
  );
}

export default function App() {
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
        {({ in: ok }) => <ReaderForm active={ok} />}
      </RevealSection>

      {/* 4. 다시 요정(타이핑) */}
      <RevealSection>
        {({ in: ok }) => <FairyAskMood active={ok} />}
      </RevealSection>

      {/* 5. Mood 선택 */}
      <RevealSection>
        {({ in: ok }) => <MoodPicker active={ok} />}
      </RevealSection>

      {/* 6. 나레이터 등록 */}
      <RevealSection>
        {({ in: ok }) => <NarratorRegister active={ok} />}
      </RevealSection>
    </main>
  );
}
```
