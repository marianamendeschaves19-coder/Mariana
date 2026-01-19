
import { GoogleGenAI, Type } from "@google/genai";

export const generateRoutineSummary = async (keywords: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Como um professor de educação infantil carinhoso, escreva uma observação curta e positiva para a agenda escolar baseada nestas palavras-chave: ${keywords}. Seja empático com os pais e use um tom acolhedor.`,
      config: {
        temperature: 0.7,
        // Fix: must set thinkingConfig when maxOutputTokens is specified for Gemini 3/2.5 models
        maxOutputTokens: 150,
        thinkingConfig: { thinkingBudget: 50 }
      }
    });

    return response.text || "O dia foi maravilhoso e repleto de descobertas!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "O dia foi muito produtivo e a criança participou de todas as atividades com alegria.";
  }
};
