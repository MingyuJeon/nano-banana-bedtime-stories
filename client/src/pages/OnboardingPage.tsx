import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import bananaImage from "../asset/banana.png";
import ImageUpload from "../components/ImageUpload";
import NarratorRegister from "../components/NarratorRegister";
import { useStoryStore } from "../store/useStoryStore";
import "./OnboardingPage.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

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

const MOODS = [
  "😄 \nHappy",
  "🙂 Normal",
  "😔 Feeling down",
  "😟 Facing worries",
  "😊 Feeling loved",
] as const;

export default function OnboardingPage({
  onComplete,
}: {
  onComplete: (data: any) => void;
}) {
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    mood: "",
    userImage: null as File | null,
    imagePreview: "",
    voiceFile: null as File | null,
    ttsId: "",
  });

  const { userImage, userInfo, voiceFile, setUserInfo } = useStoryStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // 타이핑 텍스트
  const fairyIntroText = useTyping(
    "Hi! Welcome to Banana Bedtime Stories!",
    currentSection === 1,
    24
  );
  const askAboutYouText = useTyping(
    "Tell me about yourself ☺️",
    currentSection === 2,
    24
  );
  const askMoodText = useTyping(
    "How are you feeling today?",
    currentSection === 4,
    24
  );

  // 스크롤 이벤트 핸들러 - 더 민감한 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const sectionHeight = window.innerHeight;

      // 현재 위치를 더 정확히 계산 (10% 이상 스크롤하면 다음 섹션으로)
      const scrollProgress = (scrollTop % sectionHeight) / sectionHeight;
      const baseSection = Math.floor(scrollTop / sectionHeight);

      // 10% 이상 스크롤했으면 다음 섹션으로 전환
      const section = scrollProgress > 0.1 ? baseSection + 1 : baseSection;

      // 최대 섹션 제한
      const finalSection = Math.min(section, 7);
      setCurrentSection(finalSection);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // 초기 실행
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleImageChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          userImage: file,
          imagePreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        userImage: null,
        imagePreview: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 정보 확인
    if (!userImage || !formData.name || !formData.age || !formData.gender) {
      setError("Please fill in all required information (name, age, gender, and photo)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // userInfo 설정
      const genderMap: { [key: string]: "male" | "female" | "other" } = {
        "boy": "male",
        "girl": "female",
        "nonbinary": "other",
        "prefer-not": "other"
      };

      const userInfoData = {
        age: parseInt(formData.age),
        gender: genderMap[formData.gender] || "other",
        userName: formData.name
      };
      
      setUserInfo(userInfoData);

      // FormData 생성
      const formDataToSend = new FormData();
      formDataToSend.append("userImage", userImage);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("gender", userInfoData.gender);
      if (formData.name) {
        formDataToSend.append("userName", formData.name);
      }
      if (voiceFile) {
        formDataToSend.append("voiceFile", voiceFile);
      }

      // Generate story
      const storyResponse = await axios.post(
        `${API_URL}/api/story/generate`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const {
        story,
        userImage: imagePath,
        voiceFile: voicePath,
      } = storyResponse.data;

      // Generate images for each page
      const imagePrompts = story.pages.map((page: any) => page.imagePrompt);
      const imagesResponse = await axios.post(
        `${API_URL}/api/story/generate-images`,
        {
          imagePrompts,
          userImage: imagePath,
          characterDescription: story.characterDescription || "",
        }
      );

      // Generate narration only if voice file was provided
      let narrationUrl = null;
      if (voicePath) {
        const narrationText = story.pages
          .map((page: any) => page.text)
          .join(" ");
        const narrationResponse = await axios.post(
          `${API_URL}/api/story/generate-narration`,
          {
            text: narrationText,
            voiceFile: voicePath,
          }
        );
        narrationUrl = narrationResponse.data.narrationUrl;
      }

      // Save the generated story
      const storyToSave = {
        title: story.title,
        content: story.pages.map((page: any) => page.text),
        images: imagesResponse.data.images || [],
        userImage: imagePath,
        narrationUrls: narrationUrl ? [narrationUrl] : [],
        backgroundMusic: null,
        moral: story.moral || "",
      };

      await axios.post(`${API_URL}/api/saved-stories/save`, storyToSave);

      // 성공적으로 완료되면 onComplete 호출하여 동화책 목록으로 이동
      onComplete({ showStoryList: true });
    } catch (err: any) {
      setError(
        err.response?.data?.error || "An error occurred while creating your story"
      );
      console.error("Story generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container" ref={containerRef}>
      {/* 바나나 캐릭터는 항상 고정 표시 */}
      <motion.img
        src={bananaImage}
        className="fairy-fixed"
        alt="Banana character"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Section 0: Title */}
      <section className="onboarding-section">
        <div className="section-content">
          <motion.h1
            className="title"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: currentSection === 0 ? 1 : 0,
              y: currentSection === 0 ? 0 : currentSection > 0 ? -50 : 50,
            }}
            transition={{ duration: 0.3 }}
          >
            Banana Bedtime Stories
          </motion.h1>
          <motion.p
            className="subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: currentSection === 0 ? 1 : 0,
              y: currentSection === 0 ? 0 : currentSection > 0 ? -50 : 50,
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            Bedtime stories made just for you
          </motion.p>
        </div>
      </section>

      {/* Section 1: Fairy Intro */}
      <section className="onboarding-section">
        <div className="section-content">
          <motion.div
            className="bubble"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: currentSection === 1 ? 1 : 0,
              scale: currentSection === 1 ? 1 : 0.8,
              y: currentSection > 1 ? -50 : currentSection < 1 ? 50 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            {fairyIntroText}
          </motion.div>
        </div>
      </section>

      {/* Section 2: Ask About You */}
      <section className="onboarding-section">
        <div className="section-content">
          <motion.div
            className="bubble"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: currentSection === 2 ? 1 : 0,
              scale: currentSection === 2 ? 1 : 0.8,
              y: currentSection > 2 ? -50 : currentSection < 2 ? 50 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            {askAboutYouText}
          </motion.div>
        </div>
      </section>

      {/* Section 3: Reader Form */}
      <section className="onboarding-section">
        <div className="section-content">
          <motion.form
            className="card"
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: currentSection === 3 ? 1 : 0,
              y: currentSection === 3 ? 0 : currentSection > 3 ? -30 : 30,
            }}
            transition={{ duration: 0.3 }}
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
            <label className="label">Your picture</label>
            <ImageUpload />
            {/* <div className="label">
              <span className="block mb-2">Upload Your Photo</span>
              <ImageDropzone
                value={formData.userImage}
                preview={formData.imagePreview}
                onChange={handleImageChange}
              />
            </div> */}
          </motion.form>
        </div>
      </section>

      {/* Section 4: Ask Mood */}
      <section className="onboarding-section">
        <div className="section-content">
          <motion.div
            className="bubble"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: currentSection === 4 ? 1 : 0,
              scale: currentSection === 4 ? 1 : 0.8,
              y: currentSection > 4 ? -50 : currentSection < 4 ? 50 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            {askMoodText}
          </motion.div>
        </div>
      </section>

      {/* Section 5: Final Section - Mood Picker & Voice */}
      <section className="onboarding-section">
        <div className="section-content final-section">
          {/* Mood Picker */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: currentSection === 5 ? 1 : 0,
              y: currentSection === 5 ? 0 : currentSection > 5 ? -30 : 30,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid">
              {MOODS.map((m) => (
                <button
                  key={m}
                  className={`chip ${formData.mood === m ? "selected" : ""}`}
                  type="button"
                  aria-pressed={formData.mood === m}
                  onClick={() => {
                    setFormData({ ...formData, mood: m });
                    // Scroll to next section after mood selection
                    setTimeout(() => {
                      containerRef.current?.scrollTo({
                        top: 6 * window.innerHeight,
                        behavior: "smooth",
                      });
                    }, 100);
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      <section className="onboarding-section">
        <div className="section-content">
          {/* Voice Intro */}
          <motion.div
            className="bubble"
            initial={{ opacity: 0 }}
            animate={{
              opacity: currentSection === 6 ? 1 : 0,
              y: currentSection > 6 ? -50 : currentSection < 6 ? 50 : 0,
            }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: "2rem" }}
          >
            Okay, now let's add the voice to the story.
          </motion.div>
        </div>
      </section>
      <section className="onboarding-section">
        <div className="section-content">
          {/* Narrator Register */}
          <motion.form
            className="card narrator-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: currentSection === 7 ? 1 : 0,
              y: currentSection === 7 ? 0 : currentSection > 7 ? -30 : 30,
            }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            style={{ marginTop: "2rem" }}
          >
            <h3 className="card-title">Narrator Voice</h3>
            <NarratorRegister
              onSuccess={() => {
                console.log("Narrator registered");
              }}
            />
            {/* <label className="label">
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
            </label> */}
            {error && (
              <div className="error-message" style={{ marginBottom: "1rem", color: "red" }}>
                {error}
              </div>
            )}
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Creating your story..." : "Start Story"}
            </button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
