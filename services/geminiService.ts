import { GoogleGenAI, Type } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from "../constants";
import { LogEntry } from "../types";

// Initialize Gemini Client
// Assuming process.env.API_KEY is available as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

export const getPersonalizedCoaching = async (
  entries: LogEntry[]
): Promise<{ message: string; tip: string } | null> => {
  try {
    if (entries.length === 0) {
      return {
        message: "Start logging your journey to get personalized insights.",
        tip: "Log your first activity now!",
      };
    }

    const recentLogs = entries.slice(0, 50).map((e) => ({
      type: e.type,
      time: new Date(e.timestamp).toLocaleString(),
      count: e.count,
    }));

    const prompt = `
      Analyze these recent user logs for quitting vaping:
      ${JSON.stringify(recentLogs)}

      Identify patterns or progress.
      Provide a JSON object with:
      - message: A brief, encouraging insight (max 20 words).
      - tip: A specific, actionable strategy (max 15 words).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            tip: { type: Type.STRING },
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error getting coaching:", error);
    return {
      message: "Stay consistent with your logging.",
      tip: "Take a deep breath when cravings hit.",
    };
  }
};