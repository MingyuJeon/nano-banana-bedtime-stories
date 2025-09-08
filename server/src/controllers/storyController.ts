import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { exec } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";

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
    const { age, gender, userName } = req.body;
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

    // First, detect if this is a portrait photo or a drawing/doodle
    const imageTypeResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze this image and determine if it's:
                     1. A portrait photo of a real person
                     2. A drawing, doodle, sketch, or illustration
                     
                     Respond with ONLY one word: "PORTRAIT" or "DRAWING"`,
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

    const imageType =
      imageTypeResponse.text?.trim().toUpperCase() || "PORTRAIT";
    console.log("Image type detected:", imageType);

    // Different prompts based on image type
    let analysisPrompt: string;
    if (imageType === "DRAWING") {
      analysisPrompt = `This is a drawing/doodle. Transform it into a character description for a children's story.
                       Make this doodle as a character for kids story. Create a friendly, magical character based on this drawing.
                       
                       Describe the character including:
                       - What kind of creature or character it could be (animal, magical being, person, etc.)
                       - Colors and patterns visible in the drawing
                       - Any unique features or characteristics
                       - Personality traits suggested by the drawing
                       - Clothing or accessories if any
                       - Make it appealing and friendly for children aged ${age}
                       
                       Format: Write as a single detailed paragraph that describes this character for a children's story.
                       Example: "A friendly magical creature with round eyes and a big smile, colorful fur with star patterns..."`;
    } else {
      analysisPrompt = `Analyze this portrait photo and describe the person's appearance in great detail for character consistency.
                       Provide a detailed description including:
                       - Age: ${age}
                       - Hair: color, length, style, texture
                       - Eyes: color, shape, expression
                       - Face: shape, skin tone, distinctive features
                       - Clothing: colors, style, patterns, accessories
                       - Body type and posture
                       - Any unique identifying features
                       
                       Format: Write as a single detailed paragraph that can be used as a character reference for illustration.
                       Example: "A young child with curly brown hair, bright green eyes, wearing a red t-shirt with a star pattern..."`;
    }

    const imageAnalysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: analysisPrompt,
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

    // Use userName as protagonist name if image is a portrait and userName is provided
    const protagonistName =
      imageType === "PORTRAIT" && userName ? userName : "the child";
    console.log("Protagonist name:", protagonistName);

    // Step 2: Create story with character-aware prompts
    const contents = `
      Create a magical fairy tale story for a ${age}-year-old ${gender} child.
      
      CRITICAL CHARACTER REFERENCE - Use this EXACT description for the main character:
      "${characterDescription}"
      
      ${
        imageType === "PORTRAIT" && userName
          ? `IMPORTANT: The main character's name is "${userName}". Use this name throughout the story instead of generic terms like "the child" or "they".`
          : ""
      }
      
      Story Requirements:
      1. Age-appropriate content for a ${age}-year-old
      2. The main character MUST match the description above in every scene
      3. ${
        imageType === "PORTRAIT" && userName
          ? `The main character's name is "${userName}" - use this name consistently`
          : "You can give the character an appropriate name or refer to them descriptively"
      }
      4. Include magical elements, adventure, and wonder
      5. Have a clear positive message or moral lesson about courage, happiness, imagination, friendship, confidence
      6. Create exactly 5-7 pages/scenes with vivid descriptions
      
      IMAGE PROMPT INSTRUCTIONS:
      - EVERY imagePrompt MUST begin with the EXACT character description
      - Add scene details AFTER the character description
      - Be specific about actions, expressions, and environments
      - Maintain character consistency across all prompts
      
      IMPORTANT: Return ONLY valid JSON without any markdown formatting or extra text.
      Use double quotes for all strings. Ensure no trailing commas.
      
      Return this exact JSON structure:
      {
        "title": "Your Story Title Here",
        "characterDescription": "${characterDescription}",
        "protagonistName": "${protagonistName}",
        "pages": [
          {
            "text": "First page story text here",
            "imagePrompt": "Character description, doing something, in some location, style details"
          },
          {
            "text": "Second page story text here",
            "imagePrompt": "Character description, doing something else, in another location, style details"
          }
        ],
        "moral": "The moral lesson of the story"
      }
    `;

    // Generate story using Gemini API
    console.log("Generating personalized story with character...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    const text = response.text || "";
    console.log("Raw response from Gemini:", text.substring(0, 500) + "..."); // Log first 500 chars for debugging

    // Parse the JSON response
    let storyData;
    try {
      // Clean the text first - remove any potential unwanted characters
      let cleanedText = text.trim();

      // Extract JSON from the response (Gemini might return with markdown code blocks)
      const jsonMatch = cleanedText.match(/```json\n?([\s\S]*?)\n?```/);

      if (jsonMatch && jsonMatch[1]) {
        // Found JSON in markdown code block
        cleanedText = jsonMatch[1].trim();
      } else {
        // Try to extract JSON object directly
        const jsonObjectMatch = cleanedText.match(/{[\s\S]*}/);
        if (jsonObjectMatch) {
          cleanedText = jsonObjectMatch[0];
        }
      }

      // Remove any trailing commas before closing braces/brackets (common JSON error)
      cleanedText = cleanedText.replace(/,(\s*[}\]])/g, "$1");

      // Remove any control characters that might cause parsing issues
      cleanedText = cleanedText.replace(/[\x00-\x1F\x7F]/g, (match) => {
        // Keep newlines and tabs
        if (match === "\n" || match === "\r" || match === "\t") return match;
        return "";
      });

      console.log(
        "Attempting to parse cleaned JSON:",
        cleanedText.substring(0, 200) + "..."
      );
      storyData = JSON.parse(cleanedText);

      // Validate the structure
      if (
        !storyData.title ||
        !storyData.pages ||
        !Array.isArray(storyData.pages)
      ) {
        throw new Error("Invalid story structure: missing required fields");
      }
    } catch (error) {
      console.error("Failed to parse story JSON:", error);
      console.error("Full response text:", text);

      // Try to provide a fallback story structure
      console.log("Attempting to create fallback story structure...");
      const fallbackProtagonistName =
        imageType === "PORTRAIT" && userName ? userName : "the brave child";
      storyData = {
        title: "A Magical Adventure",
        characterDescription: characterDescription,
        protagonistName: fallbackProtagonistName,
        pages: [
          {
            text: `Once upon a time, there was ${fallbackProtagonistName} who loved adventures.`,
            imagePrompt: `${characterDescription}, standing in a magical garden with butterflies, warm sunlight, children's book illustration style`,
          },
          {
            text: `One day, ${fallbackProtagonistName} discovered a hidden path in the forest that sparkled with magic.`,
            imagePrompt: `${characterDescription}, walking on a glowing forest path with magical sparkles, enchanted atmosphere, storybook style`,
          },
          {
            text: `Along the way, ${fallbackProtagonistName} met a friendly creature who became their best friend.`,
            imagePrompt: `${characterDescription}, meeting a cute magical creature in the forest, both smiling, whimsical illustration`,
          },
          {
            text: `Together, ${fallbackProtagonistName} and their friend went on amazing adventures and learned about courage and friendship.`,
            imagePrompt: `${characterDescription}, on an adventure with their magical friend, happy expressions, colorful storybook scene`,
          },
          {
            text: `And ${fallbackProtagonistName} lived happily ever after, knowing that magic exists everywhere when you believe.`,
            imagePrompt: `${characterDescription}, smiling with their magical friend under a rainbow, joyful ending scene, children's book style`,
          },
        ],
        moral: "Believe in yourself and magic will find you.",
      };

      console.log("Using fallback story structure");
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

const execAsync = promisify(exec);

// Helper function to adjust audio speed using ffmpeg
const adjustAudioSpeed = async (
  inputPath: string,
  outputPath: string,
  speed: number = 0.9
) => {
  try {
    // speed < 1.0 = slower, speed > 1.0 = faster
    // atempo range is 0.5 to 2.0, so we need to chain for extreme values
    let atempoFilter = "";
    let currentSpeed = speed;

    // Handle speeds outside the 0.5-2.0 range by chaining
    while (currentSpeed < 0.5 || currentSpeed > 2.0) {
      if (currentSpeed < 0.5) {
        atempoFilter += "atempo=0.5,";
        currentSpeed = currentSpeed / 0.5;
      } else if (currentSpeed > 2.0) {
        atempoFilter += "atempo=2.0,";
        currentSpeed = currentSpeed / 2.0;
      }
    }
    atempoFilter += `atempo=${currentSpeed}`;

    const command = `ffmpeg -i "${inputPath}" -filter:a "${atempoFilter}" -vn "${outputPath}" -y`;
    await execAsync(command);
    console.log(`Audio speed adjusted to ${speed}x`);
    return true;
  } catch (error) {
    console.error("Failed to adjust audio speed:", error);
    return false;
  }
};

export const generateNarration = async (req: Request, res: Response) => {
  try {
    const { text, voiceFile, speed = 0.9 } = req.body; // default speed 0.9 (slightly slower for kids)

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

    // Generate speech with adjustable voice settings
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.25,
        similarityBoost: 0.75,
        style: 1.4,
        useSpeakerBoost: true,
      },
    });

    // Convert audio stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    // Save audio file
    const uploadsDir = path.join(__dirname, "../../uploads");
    const tempFilename = `narration-temp-${Date.now()}.mp3`;
    const tempFilepath = path.join(uploadsDir, tempFilename);

    fs.writeFileSync(tempFilepath, audioBuffer);

    // Adjust speed if needed (not 1.0)
    let finalFilepath = tempFilepath;
    let finalFilename = tempFilename;

    if (speed !== 1.0) {
      finalFilename = `narration-${Date.now()}.mp3`;
      finalFilepath = path.join(uploadsDir, finalFilename);

      const adjusted = await adjustAudioSpeed(
        tempFilepath,
        finalFilepath,
        speed
      );

      if (adjusted) {
        // Remove temp file after speed adjustment
        fs.unlinkSync(tempFilepath);
      } else {
        // If adjustment failed, use original file
        finalFilepath = tempFilepath;
        finalFilename = tempFilename;
      }
    }

    const narrationUrl = `/uploads/${finalFilename}`;

    res.json({ narrationUrl });
  } catch (error) {
    console.error("Narration generation error:", error);
    res.status(500).json({ error: "Failed to generate narration" });
  }
};
