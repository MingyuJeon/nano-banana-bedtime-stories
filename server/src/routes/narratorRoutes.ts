import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  getNarrators, 
  createNarrator, 
  getNarratorPreview, 
  deleteNarrator 
} from '../controllers/narratorController';

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
    if (file.fieldname === 'voiceFile' && file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else if (file.fieldname === 'imageFile' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all narrators
router.get('/', getNarrators);

// Create a new narrator
router.post('/', upload.fields([
  { name: 'voiceFile', maxCount: 1 },
  { name: 'imageFile', maxCount: 1 }
]), createNarrator);

// Create a new narrator (alternative endpoint for compatibility)
router.post('/create', upload.fields([
  { name: 'voiceFile', maxCount: 1 },
  { name: 'imageFile', maxCount: 1 }
]), createNarrator);

// Get narrator preview
router.get('/:id/preview', getNarratorPreview);

// Delete a narrator
router.delete('/:id', deleteNarrator);

export default router;