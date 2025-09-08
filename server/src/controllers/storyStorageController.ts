import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const STORIES_FILE = path.join(__dirname, '../../stories.json');
const THUMBNAILS_DIR = path.join(__dirname, '../../uploads/thumbnails');

// Initialize stories file if it doesn't exist
if (!fs.existsSync(STORIES_FILE)) {
  fs.writeFileSync(STORIES_FILE, JSON.stringify({ stories: [] }, null, 2));
}

// Create thumbnails directory if it doesn't exist
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

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

// Generate thumbnail from the first image
const generateThumbnail = async (imagePath: string, storyId: string): Promise<string> => {
  try {
    const inputPath = path.join(__dirname, '../..', imagePath);
    const thumbnailFilename = `thumb-${storyId}.jpg`;
    const outputPath = path.join(THUMBNAILS_DIR, thumbnailFilename);

    // Check if the input file exists
    if (!fs.existsSync(inputPath)) {
      console.error('Image file not found:', inputPath);
      return imagePath; // Return original if thumbnail generation fails
    }

    // Generate thumbnail using sharp
    await sharp(inputPath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return `/uploads/thumbnails/${thumbnailFilename}`;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return imagePath; // Return original image path if thumbnail generation fails
  }
};

// Save a new story
export const saveStory = async (req: Request, res: Response) => {
  try {
    const { title, content, images, userImage, narrationUrls, backgroundMusic, moral } = req.body;

    if (!title || !content || !images || images.length === 0) {
      return res.status(400).json({ error: 'Title, content, and images are required' });
    }

    const storyId = uuidv4();
    
    // Generate thumbnail from the first image
    const thumbnail = await generateThumbnail(images[0], storyId);

    const story: Story = {
      id: storyId,
      title,
      content,
      images,
      thumbnail,
      userImage: userImage || '',
      narrationUrls: narrationUrls || [],
      backgroundMusic: backgroundMusic || '',
      moral: moral || '',
      createdAt: Date.now(),
    };

    // Read existing stories
    const data = fs.readFileSync(STORIES_FILE, 'utf-8');
    const storiesData = JSON.parse(data);
    
    // Add new story at the beginning (most recent first)
    storiesData.stories.unshift(story);
    
    // Save to file
    fs.writeFileSync(STORIES_FILE, JSON.stringify(storiesData, null, 2));

    res.json({ story });
  } catch (error) {
    console.error('Error saving story:', error);
    res.status(500).json({ error: 'Failed to save story' });
  }
};

// Get all stories
export const getStories = async (_req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(STORIES_FILE, 'utf-8');
    const { stories } = JSON.parse(data);
    res.json({ stories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
};

// Get a single story by ID
export const getStoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const data = fs.readFileSync(STORIES_FILE, 'utf-8');
    const { stories } = JSON.parse(data);
    
    const story = stories.find((s: Story) => s.id === id);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({ story });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
};

// Delete a story
export const deleteStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Read stories
    const data = fs.readFileSync(STORIES_FILE, 'utf-8');
    const storiesData = JSON.parse(data);
    
    // Find story to delete
    const storyIndex = storiesData.stories.findIndex((s: Story) => s.id === id);
    
    if (storyIndex === -1) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const story = storiesData.stories[storyIndex];

    // Delete thumbnail if it exists
    if (story.thumbnail) {
      const thumbnailPath = path.join(__dirname, '../..', story.thumbnail);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    // Remove from array
    storiesData.stories.splice(storyIndex, 1);
    
    // Save to file
    fs.writeFileSync(STORIES_FILE, JSON.stringify(storiesData, null, 2));

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
};