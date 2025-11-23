import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "../constants";

// Lazy initialize the client
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const editImageWithGemini = async (
  imageFile: File,
  prompt: string
): Promise<string> => {
  try {
    const ai = getAI();
    const base64Data = await fileToBase64(imageFile);
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type,
            },
          },
          {
            text: `Output ONLY the modified image. Edit strictly following: ${prompt}. Maintain aspect ratio.`,
          },
        ],
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
            const base64String = part.inlineData.data;
            // Detect mime type or default to png if missing
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mimeType};base64,${base64String}`;
            break;
        }
      }
    }

    if (!imageUrl) {
      console.warn("Gemini response did not contain inlineData. Full response:", response);
      throw new Error("A IA não retornou uma imagem válida. Pode ter sido bloqueada por filtros de segurança.");
    }

    return imageUrl;

  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};