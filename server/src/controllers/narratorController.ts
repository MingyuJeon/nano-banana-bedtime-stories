import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const NARRATORS_FILE = path.join(__dirname, '../../narrators.json');

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

// Voice cache for narrator voices
interface NarratorVoiceCache {
  [narratorId: string]: {
    voiceId: string;
    fileHash: string;
    createdAt: number;
  };
}

const voiceCachePath = path.join(__dirname, '../../narrator-voice-cache.json');
let narratorVoiceCache: NarratorVoiceCache = {};

// Load voice cache on startup
if (fs.existsSync(voiceCachePath)) {
  try {
    narratorVoiceCache = JSON.parse(fs.readFileSync(voiceCachePath, 'utf-8'));
  } catch (error) {
    console.error('Failed to load narrator voice cache:', error);
  }
}

// Save voice cache
const saveNarratorVoiceCache = () => {
  try {
    fs.writeFileSync(voiceCachePath, JSON.stringify(narratorVoiceCache, null, 2));
  } catch (error) {
    console.error('Failed to save narrator voice cache:', error);
  }
};

// Generate hash for file to use as cache key
const getFileHash = (filePath: string): string => {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// Initialize narrators file if it doesn't exist
if (!fs.existsSync(NARRATORS_FILE)) {
  fs.writeFileSync(NARRATORS_FILE, JSON.stringify({ narrators: [] }, null, 2));
}

// Get all narrators
export const getNarrators = async (_req: Request, res: Response) => {
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

    let elevenLabsVoiceId: string | null = null;

    // If voice file is provided, create voice clone with ElevenLabs
    if (voiceFile) {
      try {
        const voicePath = path.join(__dirname, '../../uploads', voiceFile.filename);
        const fileHash = getFileHash(voicePath);

        // Check if we already have this voice cloned
        const cachedNarrator = Object.values(narratorVoiceCache).find(
          cache => cache.fileHash === fileHash
        );

        if (cachedNarrator) {
          elevenLabsVoiceId = cachedNarrator.voiceId;
          console.log(`Using existing voice clone for file hash ${fileHash.substring(0, 8)}...`);
        } else {
          // Create new voice clone with ElevenLabs IVC API
          console.log(`Creating voice clone for narrator: ${name}`);
          const voice = await elevenlabs.voices.ivc.create({
            name: `Narrator - ${name}`,
            files: [fs.createReadStream(voicePath)],
          });
          
          elevenLabsVoiceId = voice.voiceId;
          
          // Cache the voice ID
          narratorVoiceCache[narratorId] = {
            voiceId: voice.voiceId,
            fileHash: fileHash,
            createdAt: Date.now(),
          };
          saveNarratorVoiceCache();
          
          console.log(`Voice clone created with ID: ${voice.voiceId}`);
        }
      } catch (error) {
        console.error('Failed to create voice clone:', error);
        // Continue without voice cloning if it fails
      }
    }

    const narrator = {
      id: narratorId,
      name,
      voiceId: elevenLabsVoiceId || narratorId, // Use ElevenLabs voiceId if available
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

// Generate speech with narrator's voice
export const generateSpeech = async (req: Request, res: Response) => {
  try {
    const { text, narratorId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for speech generation' });
    }

    if (!narratorId) {
      return res.status(400).json({ error: 'Narrator ID is required' });
    }

    // Read narrators
    const data = fs.readFileSync(NARRATORS_FILE, 'utf-8');
    const { narrators } = JSON.parse(data);
    
    const narrator = narrators.find((n: any) => n.id === narratorId);
    
    if (!narrator) {
      return res.status(404).json({ error: 'Narrator not found' });
    }

    let voiceId = narrator.voiceId;
    
    // If voiceId is just a UUID (not from ElevenLabs), use default voice
    if (!voiceId || voiceId === narrator.id) {
      console.log('Narrator does not have a cloned voice, using default voice');
      voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice as default
    }

    console.log(`Generating speech for narrator ${narrator.name} with voice ID: ${voiceId}`);

    // Generate speech using ElevenLabs TTS
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    // Convert audio stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    // Save audio file
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `narrator-speech-${Date.now()}.mp3`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, audioBuffer);
    const narrationUrl = `/uploads/${filename}`;

    console.log(`Speech generated and saved: ${filename}`);
    res.json({ narrationUrl });
  } catch (error) {
    console.error('Speech generation error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
};

// Cache for story narrations per narrator
interface StoryNarrationCache {
  [key: string]: { // key format: "storyId-narratorId-pageIndex"
    narrationUrl: string;
    createdAt: number;
  };
}

const storyNarrationCachePath = path.join(__dirname, '../../story-narration-cache.json');
let storyNarrationCache: StoryNarrationCache = {};

// Load story narration cache on startup
if (fs.existsSync(storyNarrationCachePath)) {
  try {
    storyNarrationCache = JSON.parse(fs.readFileSync(storyNarrationCachePath, 'utf-8'));
  } catch (error) {
    console.error('Failed to load story narration cache:', error);
  }
}

// Save story narration cache
const saveStoryNarrationCache = () => {
  try {
    fs.writeFileSync(storyNarrationCachePath, JSON.stringify(storyNarrationCache, null, 2));
  } catch (error) {
    console.error('Failed to save story narration cache:', error);
  }
};

// Generate batch narrations for entire story
export const generateBatchNarrations = async (req: Request, res: Response) => {
  try {
    const { storyId, narratorId, texts } = req.body;

    if (!storyId || !narratorId || !texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'storyId, narratorId, and texts array are required' });
    }

    // Read narrators
    const data = fs.readFileSync(NARRATORS_FILE, 'utf-8');
    const { narrators } = JSON.parse(data);
    
    const narrator = narrators.find((n: any) => n.id === narratorId);
    
    if (!narrator) {
      return res.status(404).json({ error: 'Narrator not found' });
    }

    let voiceId = narrator.voiceId;
    
    // If voiceId is just a UUID (not from ElevenLabs), use default voice
    if (!voiceId || voiceId === narrator.id) {
      console.log('Narrator does not have a cloned voice, using default voice');
      voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice as default
    }

    console.log(`Generating batch narrations for story ${storyId} with narrator ${narrator.name}`);

    const narrationUrls: string[] = [];
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate narration for each page
    for (let i = 0; i < texts.length; i++) {
      const cacheKey = `${storyId}-${narratorId}-${i}`;
      
      // Check if we have cached narration
      if (storyNarrationCache[cacheKey]) {
        console.log(`Using cached narration for page ${i + 1}`);
        narrationUrls.push(storyNarrationCache[cacheKey].narrationUrl);
        continue;
      }

      console.log(`Generating narration for page ${i + 1}/${texts.length}`);
      
      try {
        // Generate speech using ElevenLabs TTS
        const audio = await elevenlabs.textToSpeech.convert(voiceId, {
          text: texts[i],
          modelId: 'eleven_multilingual_v2',
          outputFormat: 'mp3_44100_128',
        });

        // Convert audio stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of audio) {
          chunks.push(Buffer.from(chunk));
        }
        const audioBuffer = Buffer.concat(chunks);

        // Save audio file
        const filename = `story-${storyId}-narrator-${narratorId}-page-${i}-${Date.now()}.mp3`;
        const filepath = path.join(uploadsDir, filename);

        fs.writeFileSync(filepath, audioBuffer);
        const narrationUrl = `/uploads/${filename}`;
        
        // Cache the narration
        storyNarrationCache[cacheKey] = {
          narrationUrl,
          createdAt: Date.now(),
        };
        
        narrationUrls.push(narrationUrl);
      } catch (error) {
        console.error(`Failed to generate narration for page ${i + 1}:`, error);
        narrationUrls.push(''); // Push empty string for failed narration
      }
    }

    // Save cache
    saveStoryNarrationCache();

    console.log(`Batch narration generation completed. Generated ${narrationUrls.filter(url => url).length}/${texts.length} narrations`);
    res.json({ narrationUrls });
  } catch (error) {
    console.error('Batch narration generation error:', error);
    res.status(500).json({ error: 'Failed to generate batch narrations' });
  }
};