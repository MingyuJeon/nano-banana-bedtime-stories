# 🌟 AI Story Teller

An interactive AI-powered storytelling application that creates personalized fairy tales for children. The app generates unique stories based on user photos, creates custom illustrations, and provides narration with various voice options.

## ✨ Features

### 📖 Story Generation
- **Personalized Stories**: AI generates unique fairy tales based on uploaded user photos
- **Age-Appropriate Content**: Stories tailored to the child's age and gender
- **Multi-Page Adventures**: Each story consists of 6-7 illustrated pages
- **Moral Lessons**: Every story includes meaningful life lessons

### 🎨 Visual Experience
- **AI-Generated Illustrations**: Custom artwork for each story page
- **Character Consistency**: Maintains character appearance throughout the story
- **Responsive Design**: Optimized viewing experience across all devices
- **Interactive UI**: Smooth page transitions and intuitive navigation

### 🎙️ Narration System
- **Multiple Narrators**: Choose from various AI voice options
- **Custom Voice Cloning**: Register your own voice as a narrator
- **Page-by-Page Narration**: Synchronized audio for each story page
- **Playback Controls**: Play, pause, and navigate with ease

### 📚 Story Management
- **Story Library**: Save and revisit generated stories
- **Thumbnail Generation**: Automatic story previews
- **Story Persistence**: All stories saved with images and narration

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **Zustand** for state management
- **Framer Motion** for animations
- **Axios** for API communication

### Backend
- **Node.js** with Express 5
- **TypeScript** for type safety
- **Google Gemini AI** for story generation
- **ElevenLabs API** for voice synthesis
- **Multer** for file uploads
- **Sharp** for image processing

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key
- ElevenLabs API key (for narration features)

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/story-teller.git
cd story-teller
```

2. **Install dependencies**

For the server:
```bash
cd server
npm install
```

For the client:
```bash
cd ../client
npm install
```

3. **Configure environment variables**

Create `.env` file in the server directory:
```env
PORT=5001
GOOGLE_API_KEY=your_google_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

Create `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:5001
```

4. **Start the application**

Start the server (from server directory):
```bash
npm run dev
```

Start the client (from client directory):
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🎮 Usage

### Creating Your First Story

1. **Upload a Photo**: Click the upload area and select a photo of the child
2. **Enter User Information**: Provide the child's name, age, and gender
3. **Generate Story**: Click "Create Story" to generate a personalized fairy tale
4. **Select Narrator**: Choose from available AI voices or register your own
5. **Enjoy the Story**: Navigate through pages, play narration, and immerse in the adventure

### Registering a Custom Narrator

1. Click "Narrator Register" button
2. Enter a name for your narrator
3. Upload a voice sample (clear audio, 30 seconds minimum)
4. Submit and wait for processing
5. Your voice will be available for all future stories

## 🗂️ Project Structure

```
story-teller/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand store
│   │   └── App.tsx       # Main application
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── index.ts      # Server entry point
│   ├── uploads/          # User uploads storage
│   └── package.json
│
└── docs/                  # Documentation
```

## 🔌 API Endpoints

### Story Generation
- `POST /api/story/generate` - Generate a new story
- `POST /api/story/generate-images` - Generate story illustrations
- `GET /api/saved-stories` - Retrieve all saved stories
- `POST /api/saved-stories/save` - Save a new story

### Narrator Management
- `GET /api/narrators` - Get all registered narrators
- `POST /api/narrators/register` - Register a new narrator
- `POST /api/narrators/generate-batch-narrations` - Generate narrations for all pages

### File Management
- `POST /uploads/*` - Serve uploaded files
- `POST /api/story/generate-thumbnail` - Generate story thumbnail

## 🎨 Features in Detail

### Story Generation Process
1. User photo analysis using AI vision
2. Character description extraction
3. Age-appropriate story plot generation
4. Moral lesson integration
5. Image prompt creation for each page
6. Illustration generation using AI
7. Story persistence with all assets

### Voice Cloning Technology
- Uses ElevenLabs API for high-quality voice synthesis
- Supports multiple languages
- Maintains voice consistency across pages
- Real-time narration generation

### Responsive Design
- Mobile-first approach
- Viewport-optimized story viewer
- Touch-friendly navigation
- Smooth animations and transitions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for story and image generation
- ElevenLabs for voice synthesis technology
- React and Node.js communities
- All contributors and testers

## 📞 Support

For support, email support@storyteller.com or open an issue in the GitHub repository.

---

Made with ❤️ for young storytellers everywhere