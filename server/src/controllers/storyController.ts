import { GoogleGenAI } from "@google/genai";
import { Request, Response } from "express";
import * as fs from "node:fs";
import * as path from "node:path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize APIs
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}
console.log("Initializing GoogleGenAI with API key:", apiKey ? `${apiKey.substring(0, 10)}...` : "NOT SET");

const ai = new GoogleGenAI({ apiKey: apiKey || "" });
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY || "" });

export const generateStory = async (req: Request, res: Response) => {
  try {
    const { age, gender } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!age || !gender) {
      return res.status(400).json({ error: "Age and gender are required" });
    }

    if (!files?.userImage?.[0]) {
      return res.status(400).json({ error: "User image is required" });
    }

    // Create a prompt for story generation
    const contents = `
      Create a fairy tale story for a ${age}-year-old ${gender} child.
      The story should:
      1. Be age-appropriate and engaging
      2. Have the child as the main character
      3. Include magical elements and adventure
      4. Have a positive message or moral
      5. Be divided into 5-7 short pages/scenes
      
      Format the response as JSON with the following structure:
      {
        "title": "Story Title",
        "pages": [
          {
            "text": "Page text content",
            "imagePrompt": "Detailed description for image generation"
          }
        ],
        "moral": "The moral of the story"
      }
    `;

    // Generate story using Gemini API
    console.log("Attempting to generate story with Gemini API...");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",  // Use stable model version
      contents,
    });

    const text = response.text || "";

    // Parse the JSON response
    let storyData;
    try {
      // Extract JSON from the response (Gemini might return with markdown code blocks)
      const jsonMatch =
        text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        storyData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        storyData = JSON.parse(text);
      }
    } catch (error) {
      console.error("Failed to parse story JSON:", error);
      return res.status(500).json({ error: "Failed to generate story" });
    }

    // Store file paths
    const imagePath = `/uploads/${files.userImage[0].filename}`;
    const voicePath = files.voiceFile?.[0]
      ? `/uploads/${files.voiceFile[0].filename}`
      : null;

    res.json({
      story: storyData,
      userImage: imagePath,
      voiceFile: voicePath,
    });
  } catch (error) {
    console.error("Story generation error:", error);
    res.status(500).json({ error: "Failed to generate story" });
  }
};

export const generateImages = async (req: Request, res: Response) => {
  try {
    const { imagePrompts } = req.body;

    if (!imagePrompts || !Array.isArray(imagePrompts)) {
      return res.status(400).json({ error: "Image prompts are required" });
    }

    const generatedImages: string[] = [];
    const uploadsDir = path.join(__dirname, "../../uploads");
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate images for each prompt
    // Note: Gemini doesn't support image generation directly
    // Using placeholder images for now
    for (let i = 0; i < imagePrompts.length; i++) {
      // For now, return placeholder images
      // In production, you would use a proper image generation service like:
      // - Stable Diffusion API
      // - DALL-E API
      // - Midjourney API
      generatedImages.push(`https://via.placeholder.com/512x512.png?text=Story+Page+${i+1}`);
      console.log(`Using placeholder for image ${i+1}`);
    }

    res.json({ images: generatedImages });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: "Failed to generate images" });
  }
};

export const generateMusic = async (_req: Request, res: Response) => {
  try {
    // const { story, mood } = req.body; // Commented as they're not used

    // Note: Lyria API requires special access and setup
    // For now, return a placeholder music URL
    // To implement Lyria:
    // 1. Get access to Lyria RealTime API
    // 2. Set up streaming infrastructure
    // 3. Use the code from bgm-generate.md
    
    const musicUrl =
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    res.json({ musicUrl });
  } catch (error) {
    console.error("Music generation error:", error);
    res.status(500).json({ error: "Failed to generate music" });
  }
};

export const generateNarration = async (req: Request, res: Response) => {
  try {
    const { text, voiceFile } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required for narration" });
    }

    let voiceId: string | null = null;

    // If a voice file was uploaded, create a voice clone
    if (voiceFile) {
      try {
        const voicePath = path.join(__dirname, "../../", voiceFile);
        const voice = await elevenlabs.voices.ivc.create({
          name: `User Voice ${Date.now()}`,
          files: [fs.createReadStream(voicePath)],
        });
        voiceId = voice.voiceId;
      } catch (error) {
        console.error("Voice cloning error:", error);
        // Fallback to default voice if cloning fails
      }
    }

    // Use default voice if no custom voice
    if (!voiceId) {
      voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
    }

    // Generate speech
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    // Convert audio stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    // Save audio file
    const uploadsDir = path.join(__dirname, "../../uploads");
    const filename = `narration-${Date.now()}.mp3`;
    const filepath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filepath, audioBuffer);
    const narrationUrl = `/uploads/${filename}`;

    res.json({ narrationUrl });
  } catch (error) {
    console.error("Narration generation error:", error);
    res.status(500).json({ error: "Failed to generate narration" });
  }
};
