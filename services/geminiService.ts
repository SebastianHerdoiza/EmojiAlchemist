import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates an emoji/icon based on a text prompt and a reference style image.
 * Uses gemini-2.5-flash-image (Nano banana).
 */
export const generateStyledEmoji = async (
  prompt: string,
  referenceImageBase64: string
): Promise<string> => {
  const ai = getClient();
  
  // Clean base64 string if it contains headers
  const cleanBase64 = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `ACT AS: Expert iOS Icon Designer.

            TASK: Generate a SINGLE 3D EMOJI object for a CIRCULAR Map Pin Container.
            PROMPT: "${prompt}"

            ⚠️ CRITICAL INSTRUCTIONS:

            1. 📐 COMPOSITION (EXTREME ZOOM):
               - **FILL THE CIRCLE**: The object must be generated as if it is inside a tight circle. 
               - **TOUCH THE EDGES**: The object must be MAXIMIZED. It should almost touch the edges of the image canvas.
               - **CENTERED**: Perfectly centered.
               - **TRANSPARENT BACKGROUND**: Mandatory.

            2. 🎭 STYLE (Apple/iOS):
               - **Soft 3D & Volume**: Use soft lighting and smooth gradients (iOS Style).
               - **NO Black Outlines**: Edges must be defined by contrast and shadows, NOT lines.
               - **Readable at 16px**: The design must be bold, solid, and simple enough to be read as a tiny dot on a map.
               - **Circular Context**: Avoid wide rectangular shapes. If the prompt is "Bus", view it from the front or 3/4 angle so it fits in a circle.

            3. 🚫 RESTRICTIONS:
               - NO Text.
               - NO Complex scenes.
               - NO Thin lines.

            OUTPUT: A single transparent PNG image.
            `
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          }
        ]
      },
      config: {
        // Gemini 2.5 Flash Image standard config
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content generated");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};