
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Uses Gemini AI to analyze an image of a medicine package.
 * Extracts key details such as name, dosage, manufacturer, and expiry.
 */
export async function analyzeMedicineImage(base64Image: string) {
  // Always use the required initialization pattern with named parameter.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    // Correct content structure for multiple parts: use { parts: [...] }
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: "Extract medicine details from this image. Only provide details if it's a medicine. Determine if it is sealed and unexpired. Current date: " + new Date().toISOString()
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the medicine" },
          dosage: { type: Type.STRING, description: "Strength/Dosage (e.g. 500mg)" },
          manufacturer: { type: Type.STRING, description: "Pharma company name" },
          expiryDate: { type: Type.STRING, description: "Expiry date in YYYY-MM-DD format" },
          isSealed: { type: Type.BOOLEAN, description: "Is the medicine packaging sealed?" },
          isUnexpired: { type: Type.BOOLEAN, description: "Is the expiry date in the future?" },
          confidence: { type: Type.NUMBER, description: "Confidence score from 0-1" }
        },
        required: ["name", "dosage", "manufacturer", "expiryDate", "isSealed", "isUnexpired"],
        propertyOrdering: ["name", "dosage", "manufacturer", "expiryDate", "isSealed", "isUnexpired", "confidence"]
      }
    }
  });

  // response.text is a property, not a method. Do not call text().
  const jsonStr = response.text?.trim();
  if (!jsonStr) {
    throw new Error("Could not extract medicine details from the provided image.");
  }
  
  return JSON.parse(jsonStr);
}
