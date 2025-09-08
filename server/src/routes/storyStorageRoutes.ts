import express from 'express';
import { 
  saveStory, 
  getStories, 
  getStoryById, 
  deleteStory 
} from '../controllers/storyStorageController';

const router = express.Router();

// Get all stories
router.get('/', getStories);

// Get a single story
router.get('/:id', getStoryById);

// Save a new story
router.post('/save', saveStory);

// Delete a story
router.delete('/:id', deleteStory);

export default router;