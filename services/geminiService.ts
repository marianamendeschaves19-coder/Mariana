
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export const generateRoutineSummary = async (keywords: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Como um professor de educação infantil carinhoso, escreva uma observação curta e positiva para a agenda escolar baseada nestas palavras-chave: ${keywords}. Seja empático com os pais e use um tom acolhedor.`,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    return response.text || "O dia foi maravilhoso e repleto de descobertas!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "O dia foi muito produtivo e a criança participou de todas as atividades com alegria.";
  }
};

export const suggestBNCC = async (objective: string, content: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Com base no objetivo "${objective}" e no conteúdo "${content}", sugira os códigos da BNCC (Base Nacional Comum Curricular) mais adequados para Educação Infantil. Retorne apenas os códigos separados por vírgula (ex: EI03EO01, EI03CG02).`,
      config: {
        temperature: 0.3,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini BNCC Error:", error);
    return "";
  }
};
