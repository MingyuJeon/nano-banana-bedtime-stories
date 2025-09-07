```ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Create a storybook for a child",
  });
  console.log(response.text);
}

await main();
```
