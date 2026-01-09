
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Uses Gemini AI to analyze an image of a medicine package.
 * Extracts key details such as name, dosage, manufacturer, and expiry.
 * If expiry is not found, it estimates based on Mfg date or generates a default.
 */
export async function analyzeMedicineImage(base64Image: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `Extract medicine details from this image. 
          FALLBACK LOGIC FOR EXPIRY DATE:
          1. If an expiry date is clearly visible, use it.
          2. If only a Manufacturing Date (Mfg) is visible, add 3 years to determine the expiry date.
          3. If NO date is visible, estimate a date exactly 6 months from today's date for safety.
          4. If the determined date is in the past, set isUnexpired to false.
          
          Current date: ${new Date().toISOString()}
          Only provide details if it's a medicine. Determine if it is sealed.`
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
          isDateEstimated: { type: Type.BOOLEAN, description: "True if the AI had to estimate/generate the date because it wasn't clearly printed." },
          confidence: { type: Type.NUMBER, description: "Confidence score from 0-1" }
        },
        required: ["name", "dosage", "manufacturer", "expiryDate", "isSealed", "isUnexpired", "isDateEstimated"],
        propertyOrdering: ["name", "dosage", "manufacturer", "expiryDate", "isSealed", "isUnexpired", "isDateEstimated", "confidence"]
      }
    }
  });

  const jsonStr = response.text?.trim();
  if (!jsonStr) {
    throw new Error("Could not extract medicine details from the provided image.");
  }
  
  return JSON.parse(jsonStr);
}
