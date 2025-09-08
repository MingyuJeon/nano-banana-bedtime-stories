import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useStoryStore } from "../store/useStoryStore";
import NarratorSelector from "./NarratorSelector";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const StoryViewer: React.FC = () => {
  const {
    currentStory,
    currentPage,
    isPlaying,
    // narrationAudio is defined but not used directly in component
    narrationAudios,
    selectedNarrator,
    isLoadingNarrations,
    setCurrentPage,
    setIsPlaying,
    setNarrationAudio,
    setNarrationAudios,
    setIsLoadingNarrations,
    resetStore,
  } = useStoryStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [showNarratorSelector, setShowNarratorSelector] = useState(false);
  const [hasGeneratedNarrations, setHasGeneratedNarrations] = useState(false);

  // Generate all narrations when narrator is selected
  useEffect(() => {
    if (selectedNarrator && currentStory && !hasGeneratedNarrations) {
      generateAllNarrations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNarrator, currentStory]);

  // Auto-play narration when page changes
  useEffect(() => {
    if (narrationAudios.length > 0 && currentPage < narrationAudios.length) {
      const currentNarrationUrl = narrationAudios[currentPage];
      if (currentNarrationUrl) {
        setNarrationAudio(`${API_URL}${currentNarrationUrl}`);
        // Auto-play the narration
        if (audioRef.current) {
          audioRef.current.src = `${API_URL}${currentNarrationUrl}`;
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
              musicRef.current?.play().catch(() => {});
            })
            .catch(() => {
              console.log("Auto-play blocked, user needs to interact first");
              setIsPlaying(false);
            });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, narrationAudios]);

  const generateAllNarrations = async () => {
    if (!currentStory || !selectedNarrator) {
      return;
    }

    setIsLoadingNarrations(true);
    setHasGeneratedNarrations(true);

    try {
      // Generate unique story ID from title and timestamp
      const storyId = `${currentStory.title.replace(/\s+/g, "-")}-${
        currentStory.id || Date.now()
      }`;

      // Call batch narration API
      const response = await axios.post(
        `${API_URL}/api/narrators/generate-batch-narrations`,
        {
          storyId,
          narratorId: selectedNarrator.id,
          texts: currentStory.content,
        }
      );

      const { narrationUrls } = response.data;
      setNarrationAudios(narrationUrls);

      console.log(`Generated ${narrationUrls.length} narrations for the story`);
    } catch (error) {
      console.error("Error generating batch narrations:", error);
      if (axios.isAxiosError(error) && error.response) {
        alert(
          `Failed to generate narration: ${
            error.response.data.error || "Server error occurred"
          }`
        );
      } else {
        alert("Failed to generate narration. Please try again.");
      }
      setHasGeneratedNarrations(false);
    } finally {
      setIsLoadingNarrations(false);
    }
  };

  const handlePlay = async () => {
    if (isPlaying) {
      // Pause playback
      audioRef.current?.pause();
      musicRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Check if we have a narrator selected
      if (!selectedNarrator) {
        alert("Please select a narrator");
        setShowNarratorSelector(true);
        return;
      }

      // Check if narrations are generated
      if (narrationAudios.length === 0) {
        alert("Generating narration... Please wait.");
        return;
      }

      // Play narration for current page
      if (narrationAudios[currentPage] && audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          musicRef.current?.play().catch(() => {});
        } catch (error) {
          console.error("Error playing audio:", error);
          console.log("Click play button again to start.");
        }
      }
    }
  };

  const handleNextPage = () => {
    if (currentStory && currentPage < currentStory.content.length - 1) {
      // Pause current audio
      audioRef.current?.pause();
      musicRef.current?.pause();
      setIsPlaying(false);

      // Move to next page
      setCurrentPage(currentPage + 1);
      // Auto-play will be triggered by useEffect
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      // Pause current audio
      audioRef.current?.pause();
      musicRef.current?.pause();
      setIsPlaying(false);

      // Move to previous page
      setCurrentPage(currentPage - 1);
      // Auto-play will be triggered by useEffect
    }
  };

  const handleRestart = () => {
    setCurrentPage(0);
    setIsPlaying(false);
    audioRef.current?.pause();
    musicRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    if (musicRef.current) musicRef.current.currentTime = 0;
  };

  const handleNewStory = () => {
    setIsPlaying(false);
    audioRef.current?.pause();
    musicRef.current?.pause();
    resetStore();
  };

  if (!currentStory) {
    return null;
  }

  return (
    <div className="story-viewer">
      <h2 style={{ textAlign: "center", marginBottom: "20px", flexShrink: 0 }}>
        {currentStory.title}
      </h2>

      {/* Narrator Selector */}
      <div style={{ marginBottom: "20px", flexShrink: 0 }}>
        <button
          onClick={() => setShowNarratorSelector(!showNarratorSelector)}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "2px solid #667eea",
            background: "white",
            color: "#667eea",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {selectedNarrator
            ? `Voice: ${selectedNarrator.name}`
            : "Voice Select"}{" "}
          ▼
        </button>

        {isLoadingNarrations && (
          <div
            style={{
              marginTop: "10px",
              padding: "10px",
              backgroundColor: "#fff3cd",
              borderRadius: "8px",
              border: "1px solid #ffc107",
              color: "#856404",
            }}
          >
            🎙️ Generating narration... Please wait.
          </div>
        )}

        {showNarratorSelector && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              border: "2px solid #e0e0e0",
              borderRadius: "12px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <NarratorSelector
              onSelect={() => {
                setShowNarratorSelector(false);
                setHasGeneratedNarrations(false); // Reset to trigger regeneration
              }}
            />
          </div>
        )}
      </div>

      <div className="story-page">
        {currentStory.images[currentPage] && (
          <img
            src={currentStory.images[currentPage]}
            alt={`Page ${currentPage + 1}`}
            style={{ width: "100%", maxWidth: "600px" }}
          />
        )}

        <div className="story-text">{currentStory.content[currentPage]}</div>
      </div>

      <div className="page-indicator">
        Page {currentPage + 1} / {currentStory.content.length}
      </div>

      <div className="story-controls">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          aria-label="Previous Page"
        >
          ← Previous
        </button>

        <button
          onClick={handlePlay}
          disabled={isLoadingNarrations}
          aria-label={isPlaying ? "Pause" : "Play"}
          style={{
            background: isLoadingNarrations
              ? "#ccc"
              : isPlaying
              ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            cursor: isLoadingNarrations ? "not-allowed" : "pointer",
          }}
        >
          {isLoadingNarrations
            ? "🎙️ Generating..."
            : isPlaying
            ? "⏸️ Pause"
            : "▶️ Play"}
        </button>

        <button
          onClick={handleNextPage}
          disabled={currentPage === currentStory.content.length - 1}
          aria-label="Next Page"
        >
          Next →
        </button>
      </div>

      <div className="story-controls" style={{ marginTop: "20px" }}>
        <button
          onClick={handleRestart}
          aria-label="Restart"
          style={{ marginRight: "10px" }}
        >
          🔄 Restart
        </button>

        <button
          onClick={handleNewStory}
          aria-label="New Story"
          style={{
            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          }}
        >
          ✨ New Story
        </button>
      </div>

      {/* Hidden audio elements */}
      <audio ref={audioRef} style={{ display: "none" }} />
      <audio ref={musicRef} style={{ display: "none" }} />
    </div>
  );
};

export default StoryViewer;
