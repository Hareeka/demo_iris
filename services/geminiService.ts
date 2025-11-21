import { GoogleGenAI, Type } from "@google/genai";
import { MoodType, HealthTip } from "../types";

// Helper to initialize client
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMoodFromImage = async (base64Image: string): Promise<{ mood: MoodType; confidence: number; suggestion: string }> => {
  const ai = getClient();
  
  const prompt = `
    Analyze the facial expression of the person in this image to determine their mood.
    Classify the mood into one of these categories: Happy, Sad, Angry, Stressed, Excited, Calm, Neutral.
    Also provide a very short, one-sentence comforting or celebratory suggestion based on the mood.
  `;

  try {
    // Cleaning base64 string if it contains metadata prefix
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING, enum: Object.values(MoodType) },
            confidence: { type: Type.NUMBER },
            suggestion: { type: Type.STRING }
          },
          required: ["mood", "confidence", "suggestion"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      mood: result.mood as MoodType || MoodType.NEUTRAL,
      confidence: result.confidence || 0.5,
      suggestion: result.suggestion || "Stay balanced."
    };
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return { mood: MoodType.NEUTRAL, confidence: 0, suggestion: "Could not analyze mood at this moment." };
  }
};

export const getHealthTipsForMood = async (mood: MoodType, interest: string): Promise<HealthTip> => {
  const ai = getClient();
  
  const prompt = `
    The user is currently feeling ${mood} and is interested in ${interest}.
    Provide a psychological health tip or activity suggestion to help them manage or enhance this mood.
    If negative mood, suggest calming techniques. If positive, suggest ways to channel energy.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            actionItem: { type: Type.STRING }
          },
          required: ["title", "description", "actionItem"]
        }
      }
    });
    
    return JSON.parse(response.text || '{}') as HealthTip;
  } catch (error) {
    console.error("Gemini Tips Error:", error);
    return { title: "Breathe", description: "Take a deep breath.", actionItem: "Inhale for 4s, hold for 4s, exhale for 4s." };
  }
};

export const sparkStoryAssistant = async (currentText: string, mood: MoodType): Promise<string> => {
  const ai = getClient();
  
  const prompt = `
    The user is writing a story in a DIY Storybook. They are feeling ${mood}.
    Current story text: "${currentText.slice(-500)}"
    Provide a creative "Spark" - a short paragraph (max 2 sentences) suggesting where the plot could go next,
    tailored to help them express or balance their current emotion.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Once upon a time...";
  } catch (error) {
    return "The adventure continues in unexpected ways...";
  }
};