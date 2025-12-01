import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Identify the main food item in this image. Estimate the portion size visible. Provide a nutritional breakdown for that estimated portion. Be as accurate as possible with calorie counts. If it's a mixed meal, estimate the aggregate.",
          },
        ],
      },
      config: {
        systemInstruction: "You are an expert nutritionist and dietitian API. Your goal is to accurately identify food from images and calculate nutritional values. If the image does not contain food, fill the fields with 0 or empty strings, but indicate it in the description.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: {
              type: Type.STRING,
              description: "The name of the food item or meal.",
            },
            calories: {
              type: Type.NUMBER,
              description: "Total estimated calories (kcal).",
            },
            protein: {
              type: Type.NUMBER,
              description: "Total protein in grams.",
            },
            carbs: {
              type: Type.NUMBER,
              description: "Total carbohydrates in grams.",
            },
            fat: {
              type: Type.NUMBER,
              description: "Total fat in grams.",
            },
            description: {
              type: Type.STRING,
              description: "A short, appetizing description of the food.",
            },
            portionEstimate: {
              type: Type.STRING,
              description: "A text description of the estimated portion size (e.g., '1 large bowl', '2 slices').",
            },
          },
          required: ["foodName", "calories", "protein", "carbs", "fat", "description", "portionEstimate"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data as FoodAnalysis;
    } else {
      throw new Error("No data returned from AI");
    }
  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    throw error;
  }
};