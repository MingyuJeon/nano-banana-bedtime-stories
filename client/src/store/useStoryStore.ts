import { create } from "zustand";

interface UserInfo {
  age: number;
  gender: "male" | "female" | "other";
  userName: string;
}

interface Story {
  id: string;
  title: string;
  content: string[];
  images: string[];
}

interface Narrator {
  id: string;
  name: string;
  voiceId: string;
  imageUrl?: string;
  createdAt?: number;
  isDefault?: boolean;
}

interface StoryStore {
  // User data
  userImage: File | null;
  userInfo: UserInfo | null;
  voiceFile: File | null;

  // Narrator data
  selectedNarrator: Narrator | null;

  // Story data
  currentStory: Story | null;
  backgroundMusic: string | null;
  narrationAudio: string | null;
  narrationAudios: string[]; // All narrations for the story

  // Playback state
  isPlaying: boolean;
  currentPage: number;
  isLoadingNarrations: boolean;

  // Actions
  setUserImage: (image: File | null) => void;
  setUserInfo: (info: UserInfo) => void;
  setVoiceFile: (file: File | null) => void;
  setSelectedNarrator: (narrator: Narrator | null) => void;
  setCurrentStory: (story: Story | null) => void;
  setBackgroundMusic: (url: string | null) => void;
  setNarrationAudio: (url: string | null) => void;
  setNarrationAudios: (urls: string[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPage: (page: number) => void;
  setIsLoadingNarrations: (loading: boolean) => void;
  resetStore: () => void;
}

const initialState = {
  userImage: null,
  userInfo: null,
  userName: null,
  voiceFile: null,
  selectedNarrator: null,
  currentStory: null,
  backgroundMusic: null,
  narrationAudio: null,
  narrationAudios: [],
  isPlaying: false,
  currentPage: 0,
  isLoadingNarrations: false,
};

export const useStoryStore = create<StoryStore>((set) => ({
  ...initialState,
  setUserImage: (image) => set({ userImage: image }),
  setUserInfo: (info) => set({ userInfo: info }),
  setVoiceFile: (file) => set({ voiceFile: file }),
  setSelectedNarrator: (narrator) => set({ selectedNarrator: narrator }),
  setCurrentStory: (story) =>
    set({ currentStory: story, currentPage: 0, narrationAudios: [] }),
  setBackgroundMusic: (url) => set({ backgroundMusic: url }),
  setNarrationAudio: (url) => set({ narrationAudio: url }),
  setNarrationAudios: (urls) => set({ narrationAudios: urls }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setIsLoadingNarrations: (loading) => set({ isLoadingNarrations: loading }),
  resetStore: () => set(initialState),
}));
