import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { ComplianceResult, PlanResponse } from "../types";

const apiKey = process.env.API_KEY;

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey });

interface ImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  }
}

/**
 * Chat with Aurelia - The Thinking Partner
 * Supports Multimodal Input and Context Awareness
 */
export const sendChatMessage = async (
  history: { role: string; parts: ({ text: string } | ImagePart)[] }[],
  message: string,
  images: { data: string; mimeType: string }[] = [],
  context: string = ""
): Promise<string> => {
  if (!apiKey) {
      return "System Error: API Key is missing. Please check your .env file or Vercel settings.";
  }

  try {
    // Switch to Flash for better stability and latency
    const model = "gemini-3-flash-preview";
    
    // Construct the user message part(s)
    // Filter out empty text to avoid API errors
    const userParts: ({ text: string } | ImagePart)[] = [];
    if (message && message.trim()) {
        userParts.push({ text: message });
    }
    
    // Add images if present
    images.forEach(img => {
      userParts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType
        }
      });
    });

    if (userParts.length === 0) {
        return "Please provide text or an image.";
    }

    const chat = ai.chats.create({
      model: model,
      history: history,
      config: {
        systemInstruction: `You are Aurelia, a specialized AI Co-founder designed explicitly for the solo entrepreneur. 
        
        **Your Core Identity:**
        You exist to bridge the gap between human ambition and execution. You understand that solo founders face unique challenges: isolation, decision fatigue, and the need to wear every hat. You are their psychological anchor and strategic architect.

        **Your Operational Modality:**
        1. **Empathetic yet Ruthless:** Validate their feelings (burnout is real), but ruthlessly prioritize their focus. We do not waste energy on "nice-to-haves."
        2. **The "Co-founder" Stance:** Don't just answer questions. Challenge assumptions. Ask "Why?" proactively. If a user suggests a bad idea, gently guide them to a better path using logic, not judgment.
        3. **Resource Awareness:** Always remember the user has limited time and capital. Suggest high-leverage, low-cost solutions (automation, MVP testing) over expensive scaling strategies.
        
        **Tone:**
        Futuristic, warm, professional, and calm. Use terms like "Operator," "Bandwidth," "Protocol," and "Signal."

        USER CONTEXT (Current Business State):
        ${context}
        
        **Guidelines:**
        - Use Markdown formatting heavily (Bold key insights, Bullet points for steps).
        - If the user asks about technical/legal/financial topics, give a high-level overview but suggest they use the specific "Regulatory" or "Foundations" tools for deep dives.
        `,
        temperature: 0.7,
      },
    });

    // Send the message with constructed parts (Text + Images)
    const result = await chat.sendMessage({ 
        message: userParts
    });
    
    return result.text || "I received your signal, but the data stream was empty. Please try again.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    // Return the actual error message for debugging
    return `CRITICAL_FAILURE: Connection to Neural Core failed. \n\nReason: ${error.message || "Unknown Network Error"}.\n\nPlease verify your API Key in Vercel settings and check your internet connection.`;
  }
};

/**
 * Generates a 30/60/90 Day Plan with Granular Sub-tasks
 */
export const generateStrategicPlan = async (businessIdea: string, currentStage: string): Promise<PlanResponse | null> => {
  try {
    const prompt = `Create a detailed 30-60-90 day plan for a solo founder. 
    Business Idea: ${businessIdea}
    Current Stage: ${currentStage}
    
    Focus on low-cost validation, mental health sustainability, and revenue generation.
    For each objective, provide a main goal and 2-3 key results (metrics).
    For each task, provide a main action and 2-3 granular sub-tasks to complete it.`;

    const periodSchema = {
      type: Type.OBJECT,
      properties: {
        period: { type: Type.STRING },
        focus: { type: Type.STRING },
        objectives: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT,
                properties: {
                    main: { type: Type.STRING },
                    keyResults: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["main", "keyResults"]
            } 
        },
        tasks: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    subtasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["text", "subtasks"]
            } 
        },
      },
      required: ["period", "focus", "objectives", "tasks"]
    };

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        days30: periodSchema,
        days60: periodSchema,
        days90: periodSchema,
      },
      required: ["days30", "days60", "days90"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as PlanResponse;
    }
    return null;
  } catch (error) {
    console.error("Plan Generation Error:", error);
    throw error;
  }
};

/**
 * Simplifies Regulatory Text or Document
 */
export const simplifyRegulation = async (complexText: string, image?: { data: string, mimeType: string }): Promise<ComplianceResult | null> => {
  try {
    const parts: any[] = [
        { text: `Analyze the following regulatory text or document image. 
        Explain it to a solo founder in simple terms. 
        List immediate actionable steps. 
        Assess risk level (Low/Medium/High) of non-compliance.
        
        Text Content: "${complexText}"` }
    ];

    if (image) {
        parts.push({
            inlineData: {
                data: image.data,
                mimeType: image.mimeType
            }
        });
    }

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        simplified: { type: Type.STRING, description: "Clear, plain English explanation" },
        actionItems: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Checklist of what to do" },
        riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
      },
      required: ["simplified", "actionItems", "riskLevel"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Flash image model could be used, but 3-flash supports image inputs too
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ComplianceResult;
    }
    return null;
  } catch (error) {
    console.error("Regulatory API Error:", error);
    throw error;
  }
};

/**
 * Generate a refined prompt for the user
 */
export const optimizePrompt = async (goal: string, context: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are an expert prompt engineer. 
            User Goal: ${goal}
            User Context: ${context}
            
            Write a highly effective, structure prompt that the user can copy and paste into an AI tool to get the best result.
            Return ONLY the prompt text, no conversational filler.`
        });
        return response.text || "Could not generate prompt.";
    } catch (e) {
        return "Error generating prompt.";
    }
}

/**
 * Generate Speech from Text (TTS)
 */
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};