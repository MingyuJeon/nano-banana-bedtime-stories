import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const NARRATORS_FILE = path.join(__dirname, '../../narrators.json');

// Initialize narrators file if it doesn't exist
if (!fs.existsSync(NARRATORS_FILE)) {
  fs.writeFileSync(NARRATORS_FILE, JSON.stringify({ narrators: [] }, null, 2));
}

// Get all narrators
export const getNarrators = async (req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(NARRATORS_FILE, 'utf-8');
    const { narrators } = JSON.parse(data);
    res.json({ narrators });
  } catch (error) {
    console.error('Error fetching narrators:', error);
    res.status(500).json({ error: 'Failed to fetch narrators' });
  }
};

// Create a new narrator
export const createNarrator = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!name) {
      return res.status(400).json({ error: 'Narrator name is required' });
    }

    const narratorId = uuidv4();
    const voiceFile = files?.voiceFile?.[0];
    const imageFile = files?.imageFile?.[0];

    const narrator = {
      id: narratorId,
      name,
      voiceId: narratorId,
      voiceUrl: voiceFile ? `/uploads/${voiceFile.filename}` : null,
      imageUrl: imageFile ? `/uploads/${imageFile.filename}` : null,
      createdAt: Date.now(),
    };

    // Read existing narrators
    const data = fs.readFileSync(NARRATORS_FILE, 'utf-8');
    const narratorsData = JSON.parse(data);
    
    // Add new narrator
    narratorsData.narrators.push(narrator);
    
    // Save to file
    fs.writeFileSync(NARRATORS_FILE, JSON.stringify(narratorsData, null, 2));

    res.json({ narrator });
  } catch (error) {
    console.error('Error creating narrator:', error);
    res.status(500).json({ error: 'Failed to create narrator' });
  }
};

// Get narrator preview audio
export const getNarratorPreview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Read narrators
    const data = fs.readFileSync(NARRATORS_FILE, 'utf-8');
    const { narrators } = JSON.parse(data);
    
    const narrator = narrators.find((n: any) => n.id === id);
    
    if (!narrator) {
      return res.status(404).json({ error: 'Narrator not found' });
    }

    if (!narrator.voiceUrl) {
      return res.status(404).json({ error: 'Narrator voice not found' });
    }

    res.json({ previewUrl: narrator.voiceUrl });
  } catch (error) {
    console.error('Error getting narrator preview:', error);
    res.status(500).json({ error: 'Failed to get narrator preview' });
  }
};

// Delete a narrator
export const deleteNarrator = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Read narrators
    const data = fs.readFileSync(NARRATORS_FILE, 'utf-8');
    const narratorsData = JSON.parse(data);
    
    // Find narrator to delete
    const narratorIndex = narratorsData.narrators.findIndex((n: any) => n.id === id);
    
    if (narratorIndex === -1) {
      return res.status(404).json({ error: 'Narrator not found' });
    }

    const narrator = narratorsData.narrators[narratorIndex];

    // Delete associated files
    if (narrator.voiceUrl) {
      const voicePath = path.join(__dirname, '../..', narrator.voiceUrl);
      if (fs.existsSync(voicePath)) {
        fs.unlinkSync(voicePath);
      }
    }

    if (narrator.imageUrl) {
      const imagePath = path.join(__dirname, '../..', narrator.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Remove from array
    narratorsData.narrators.splice(narratorIndex, 1);
    
    // Save to file
    fs.writeFileSync(NARRATORS_FILE, JSON.stringify(narratorsData, null, 2));

    res.json({ message: 'Narrator deleted successfully' });
  } catch (error) {
    console.error('Error deleting narrator:', error);
    res.status(500).json({ error: 'Failed to delete narrator' });
  }
};