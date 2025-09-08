import axios from "axios";
import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

interface Story {
  id: string;
  title: string;
  content: string[];
  images: string[];
  thumbnail: string;
  userImage: string;
  narrationUrls?: string[];
  backgroundMusic?: string;
  moral?: string;
  createdAt: number;
}

interface StoryListProps {
  onSelectStory: (story: Story) => void;
  onCreateNew: () => void;
}

const StoryList: React.FC<StoryListProps> = ({
  onSelectStory,
  onCreateNew,
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/saved-stories`);
      setStories(response.data.stories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stories");
      console.error("Failed to fetch stories:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          fontSize: "18px",
          color: "#667eea",
        }}
      >
        Loading story list...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#dc3545", marginBottom: "16px" }}>
            Error: {error}
          </p>
          <button
            onClick={() => fetchStories()}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          My Story List
        </h2>
        <button
          onClick={onCreateNew}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
          }}
        >
          Create New Story
        </button>
      </div>

      {stories.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            color: "#6c757d",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "20px" }}>
            No stories saved yet.
          </p>
          <button
            onClick={onCreateNew}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Create New Story
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => onSelectStory(story)}
              style={{
                position: "relative",
                backgroundColor: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 15px rgba(0, 0, 0, 0.1)";
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  overflow: "hidden",
                  backgroundColor: "#f0f0f0",
                }}
              >
                <img
                  src={`${API_URL}${story.thumbnail}`}
                  alt={story.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `${API_URL}${story.images[0]}`;
                  }}
                />
              </div>

              {/* Story Info */}
              <div style={{ padding: "16px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    color: "#333",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {story.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {story.content[0]}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    {formatDate(story.createdAt)}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#667eea",
                      fontWeight: "bold",
                    }}
                  >
                    {story.content.length} pages
                  </span>
                </div>
              </div>

              {/* Page count badge */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "rgba(102, 126, 234, 0.9)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                📖 {story.content.length}p
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryList;
