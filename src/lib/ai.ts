import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function breakdownTask(taskTitle: string, description?: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Break down the following student task into manageable sub-tasks:
      Title: ${taskTitle}
      Description: ${description || 'N/A'}
      
      Return a maximum of 5 sub-tasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title"]
              }
            }
          },
          required: ["subTasks"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result.subTasks.map((st: any, index: number) => ({
      id: `ai-${index}-${Date.now()}`,
      title: st.title,
      completed: false
    }));
  } catch (error) {
    console.error("AI breakdown error:", error);
    return [];
  }
}
