
import { GoogleGenAI, Type } from "@google/genai";
import { AIExtractionResult } from "../types";

// Always use named parameter for apiKey and direct process.env.API_KEY reference
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractVehicleInfo(base64Image: string): Promise<AIExtractionResult> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: "Extract information from this image related to a vehicle or tracking device. Look specifically for license plates (Mercosul or old style), vehicle model names, IMEI numbers from labels, serial numbers, and brands. Return strictly JSON.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plate: { type: Type.STRING, description: "Vehicle license plate" },
          model: { type: Type.STRING, description: "Vehicle model or tracking device model" },
          imei: { type: Type.STRING, description: "IMEI number if found" },
          brand: { type: Type.STRING, description: "Brand name (Toyota, Getrak, etc)" },
          serial: { type: Type.STRING, description: "Serial number if found" },
        },
      },
    },
  });

  try {
    // response.text is a property, not a method
    const text = response.text;
    if (!text) return {};
    return JSON.parse(text) as AIExtractionResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return {};
  }
}
