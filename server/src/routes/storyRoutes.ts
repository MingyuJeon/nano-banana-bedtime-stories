import express from 'express';
import multer from 'multer';
import path from 'path';
import { generateStory, generateImages, generateMusic, generateNarration } from '../controllers/storyController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'userImage' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else if (file.fieldname === 'voiceFile' && file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Generate story endpoint
router.post('/generate', upload.fields([
  { name: 'userImage', maxCount: 1 },
  { name: 'voiceFile', maxCount: 1 }
]), generateStory);

// Generate images for story
router.post('/generate-images', generateImages);

// Generate background music
router.post('/generate-music', generateMusic);

// Generate narration
router.post('/generate-narration', generateNarration);

export default router;