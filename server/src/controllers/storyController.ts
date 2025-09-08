import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Request, Response } from "express";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

// Load environment variables
dotenv.config();

// Initialize APIs
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}
console.log(
  "Initializing GoogleGenAI with API key:",
  apiKey ? `${apiKey.substring(0, 10)}...` : "NOT SET"
);

const ai = new GoogleGenAI({ apiKey: apiKey || "" });
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
});

// Voice ID cache - stores mapping of file hash to voice ID
interface VoiceCache {
  [fileHash: string]: {
    voiceId: string;
    createdAt: number;
  };
}

const voiceCachePath = path.join(__dirname, "../../voice-cache.json");
let voiceCache: VoiceCache = {};

// Load voice cache on startup
if (fs.existsSync(voiceCachePath)) {
  try {
    voiceCache = JSON.parse(fs.readFileSync(voiceCachePath, "utf-8"));
  } catch (error) {
    console.error("Failed to load voice cache:", error);
  }
}

// Save voice cache
const saveVoiceCache = () => {
  try {
    fs.writeFileSync(voiceCachePath, JSON.stringify(voiceCache, null, 2));
  } catch (error) {
    console.error("Failed to save voice cache:", error);
  }
};

// Generate hash for file to use as cache key
const getFileHash = (filePath: string): string => {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
};

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

    // Step 1: Analyze user's uploaded image to extract character features
    const userImagePath = path.join(
      __dirname,
      "../../uploads",
      files.userImage[0].filename
    );
    const imageData = fs.readFileSync(userImagePath);
    const base64Image = imageData.toString("base64");

    console.log("Analyzing user image for character features...");
    const imageAnalysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze this image and describe the person's appearance in great detail for character consistency.
                     Provide a detailed description including:
                     - Age: ${age}
                     - Hair: color, length, style, texture
                     - Eyes: color, shape, expression
                     - Face: shape, skin tone, distinctive features
                     - Clothing: colors, style, patterns, accessories
                     - Body type and posture
                     - Any unique identifying features
                     
                     Format: Write as a single detailed paragraph that can be used as a character reference for illustration.
                     Example: "A young child with curly brown hair, bright green eyes, wearing a red t-shirt with a star pattern..."
                     `,
            },
            {
              inlineData: {
                mimeType: files.userImage[0].mimetype,
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const characterDescription =
      imageAnalysisResponse.text || "a child with bright eyes and a warm smile";
    console.log("Character description:", characterDescription);

    // Step 2: Create story with character-aware prompts
    const contents = `
      Create a magical fairy tale story for a ${age}-year-old ${gender} child.
      
      CRITICAL CHARACTER REFERENCE - Use this EXACT description for the main character:
      "${characterDescription}"
      
      Story Requirements:
      1. Age-appropriate content for a ${age}-year-old
      2. The main character MUST match the description above in every scene
      3. Include magical elements, adventure, and wonder
      4. Have a clear positive message or moral lesson
      5. Create exactly 5-7 pages/scenes with vivid descriptions
      
      IMAGE PROMPT INSTRUCTIONS:
      - EVERY imagePrompt MUST begin with the EXACT character description
      - Add scene details AFTER the character description
      - Be specific about actions, expressions, and environments
      - Maintain character consistency across all prompts
      
      Format as JSON:
      {
        "title": "Story Title",
        "characterDescription": "${characterDescription}",
        "pages": [
          {
            "text": "Story text for this page (2-3 sentences)",
            "imagePrompt": "${characterDescription}, [specific action/pose], [detailed environment], [mood/lighting], children's book illustration style"
          }
        ],
        "moral": "The lesson or moral of the story"
      }
      
      Example imagePrompt format:
      "${characterDescription}, standing in a magical forest with glowing butterflies, warm sunset lighting, whimsical storybook style"
    `;

    // Generate story using Gemini API
    console.log("Generating personalized story with character...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    const { imagePrompts, userImage, characterDescription } = req.body;

    if (
      !imagePrompts ||
      !Array.isArray(imagePrompts) ||
      imagePrompts.length === 0
    ) {
      return res.status(400).json({ error: "Image prompts are required" });
    }

    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Note: User image could be used here for future enhancements
    // For example, passing it along with prompts for better character consistency
    if (userImage) {
      console.log("User image available for reference:", userImage);
    }

    console.log("Generating images with gemini-2.5-flash-image-preview...");

    const images = await Promise.all(
      imagePrompts.map(async (prompt: string, idx: number) => {
        try {
          // Enhanced prompt with character description and style
          const enhancedPrompt = `
            Create a children's book illustration in a warm, colorful, and friendly style.
            Main character: ${characterDescription}
            Scene: ${prompt}
            Style: Vibrant colors, soft edges, child-friendly, storybook illustration.
            Make sure the main character looks consistent with the description provided.
          `;

          console.log(`Generating image ${idx + 1}/${imagePrompts.length}...`);

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image-preview",
            contents: enhancedPrompt,
          });

          // Extract image data from response
          const candidates = response.candidates || [];
          if (!candidates[0]?.content?.parts) {
            throw new Error("No image parts in response");
          }

          const parts = candidates[0].content.parts;
          const imagePart = parts.find((part: any) => part.inlineData?.data);

          if (!imagePart?.inlineData?.data) {
            console.error(
              "No image data found in response for prompt:",
              prompt
            );
            throw new Error("No image data in response");
          }

          // Save the generated image
          const imageData = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType || "image/png";
          const ext = mimeType.split("/")[1] || "png";
          const filename = `story-image-${Date.now()}-${idx}.${ext}`;
          const filepath = path.join(uploadsDir, filename);

          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync(filepath, buffer);
          console.log(`Image saved: ${filename}`);

          return `/uploads/${filename}`;
        } catch (error) {
          console.error(`Failed to generate image ${idx + 1}:`, error);
          // Fallback to user image if generation fails
          return userImage || `/uploads/placeholder-${idx}.png`;
        }
      })
    );

    console.log("All images generated successfully");
    res.json({ images });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: "Failed to generate images" });
  }
};

export const generateNarration = async (req: Request, res: Response) => {
  try {
    const { text, voiceFile } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required for narration" });
    }

    let voiceId: string | null = null;

    // If a voice file was provided and is not null, use or create voice clone
    if (voiceFile && voiceFile !== null && voiceFile !== "null") {
      try {
        const voicePath = path.join(__dirname, "../../", voiceFile);

        // Check if the file actually exists
        if (fs.existsSync(voicePath)) {
          // Generate hash for the voice file
          const fileHash = getFileHash(voicePath);

          // Check if we have a cached voice ID for this file
          if (voiceCache[fileHash]) {
            voiceId = voiceCache[fileHash].voiceId;
            console.log(
              `Using cached voice ID for file hash ${fileHash.substring(
                0,
                8
              )}...`
            );
          } else {
            // Create new voice clone only if not cached
            console.log(
              `Creating new voice clone for file hash ${fileHash.substring(
                0,
                8
              )}...`
            );
            const voice = await elevenlabs.voices.ivc.create({
              name: `User Voice ${Date.now()}`,
              files: [fs.createReadStream(voicePath)],
            });
            voiceId = voice.voiceId;

            // Cache the voice ID
            voiceCache[fileHash] = {
              voiceId: voice.voiceId,
              createdAt: Date.now(),
            };
            saveVoiceCache();
            console.log(
              `Voice clone created and cached with ID: ${voice.voiceId}`
            );
          }
        } else {
          console.log("Voice file path does not exist:", voicePath);
        }
      } catch (error) {
        console.error("Voice cloning error:", error);
        // Fallback to default voice if cloning fails
      }
    }

    // Use default voice if no custom voice
    if (!voiceId) {
      voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
      console.log("Using default voice (Rachel)");
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
