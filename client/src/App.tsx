import axios from "axios";
import { useState } from "react";
import "./App.css";
import ImageUpload from "./components/ImageUpload";
import NarratorList from "./components/NarratorList";
import NarratorRegister from "./components/NarratorRegister";
import StoryList from "./components/StoryList";
import StoryViewer from "./components/StoryViewer";
import UserInfo from "./components/UserInfo";
import OnboardingPage from "./pages/OnboardingPage";
import { useStoryStore } from "./store/useStoryStore";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
const toAbsoluteUrl = (url: string) =>
  url && !url.startsWith("http") ? `${API_URL}${url}` : url;

function App() {
  const {
    userImage,
    userInfo,
    voiceFile,
    currentStory,
    setCurrentStory,
    setBackgroundMusic,
    setNarrationAudio,
  } = useStoryStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNarratorRegister, setShowNarratorRegister] = useState(false);
  const [showNarratorList, setShowNarratorList] = useState(false);
  const [showStoryList, setShowStoryList] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleGenerateStory = async () => {
    if (!userImage || !userInfo) {
      setError("이미지와 사용자 정보를 모두 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create form data
      const formData = new FormData();
      formData.append("userImage", userImage);
      formData.append("age", userInfo.age.toString());
      formData.append("gender", userInfo.gender);
      if (userInfo.userName) {
        formData.append("userName", userInfo.userName);
      }
      if (voiceFile) {
        formData.append("voiceFile", voiceFile);
      }

      // Generate story
      const storyResponse = await axios.post(
        `${API_URL}/api/story/generate`,
        formData,
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

      console.log("imagesResponse", imagesResponse.data);

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
        backgroundMusic: null, // No longer generating background music
        moral: story.moral || "",
      };

      await axios.post(`${API_URL}/api/saved-stories/save`, storyToSave);

      // Show story list instead of directly showing the story
      setShowStoryList(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "스토리 생성 중 오류가 발생했습니다"
      );
      console.error("Story generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStory = async (story: any) => {
    // Set the selected story to current story
    setCurrentStory({
      id: story.id,
      title: story.title,
      content:
        story.content || story.pages?.map((page: any) => page.text) || [],
      images: (
        story.images ||
        story.pages?.map((page: any) => page.imageUrl) ||
        []
      ).map((url: string) => toAbsoluteUrl(url)),
    });

    // Set background music if available
    if (story.backgroundMusic) {
      setBackgroundMusic(toAbsoluteUrl(story.backgroundMusic));
    }

    // Set narration if available
    if (story.narrationUrls && story.narrationUrls.length > 0) {
      setNarrationAudio(toAbsoluteUrl(story.narrationUrls[0]));
    }

    setShowStoryList(false);
  };

  const handleCreateNew = () => {
    setShowStoryList(false);
    setCurrentStory(null);
  };

  const handleBackToList = () => {
    setCurrentStory(null);
    setShowStoryList(true);
  };

  const handleOnboardingComplete = (data: any) => {
    setShowOnboarding(false);
    // Here you can process the onboarding data and use it for story generation
    console.log("Onboarding completed with data:", data);
    // TODO: Use onboarding data to populate userInfo and other fields
  };

  // Show onboarding page first
  if (showOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>AI 동화책 만들기</h1>
          <p>당신만의 특별한 동화를 만들어보세요</p>
          {!showStoryList && !currentStory && !showNarratorList && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                marginTop: "10px",
              }}
            >
              <button
                onClick={() => setShowStoryList(true)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "2px solid #764ba2",
                  background: "white",
                  color: "#764ba2",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                📚 내 동화책 목록 보기
              </button>
              <button
                onClick={() => setShowNarratorList(true)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "2px solid #667eea",
                  background: "white",
                  color: "#667eea",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                🎙️ 나레이터 목록 보기
              </button>
            </div>
          )}
        </div>

        {showNarratorList ? (
          <NarratorList onClose={() => setShowNarratorList(false)} />
        ) : showStoryList ? (
          <StoryList
            onSelectStory={handleSelectStory}
            onCreateNew={handleCreateNew}
          />
        ) : !currentStory ? (
          <>
            <div className="content-grid">
              <div className="input-section">
                <ImageUpload />
              </div>
              <div className="input-section">
                <UserInfo />
              </div>
            </div>

            <div className="input-section" style={{ marginBottom: "30px" }}>
              <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <button
                  onClick={() => setShowNarratorRegister(!showNarratorRegister)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "2px solid #764ba2",
                    background: "white",
                    color: "#764ba2",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {showNarratorRegister
                    ? "나레이터 등록 닫기"
                    : "나레이터 등록 열기"}
                </button>
              </div>

              {showNarratorRegister && (
                <div
                  style={{
                    padding: "20px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "12px",
                    backgroundColor: "#f9f9f9",
                    marginBottom: "20px",
                  }}
                >
                  <NarratorRegister
                    onSuccess={() => {
                      alert(
                        "나레이터가 등록되었습니다! 동화 페이지에서 사용할 수 있습니다."
                      );
                    }}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="error-message" style={{ marginBottom: "20px" }}>
                {error}
              </div>
            )}

            <div style={{ textAlign: "center" }}>
              <button
                onClick={handleGenerateStory}
                disabled={loading || !userImage || !userInfo}
                style={{ fontSize: "1.2rem", padding: "15px 40px" }}
              >
                {loading ? "동화 생성 중..." : "동화 만들기"}
              </button>
            </div>

            {loading && (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>AI가 당신만의 특별한 동화를 만들고 있습니다...</p>
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleBackToList}
              style={{
                marginBottom: "20px",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "2px solid #764ba2",
                background: "white",
                color: "#764ba2",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              ← 동화책 목록으로 돌아가기
            </button>
            <StoryViewer />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
