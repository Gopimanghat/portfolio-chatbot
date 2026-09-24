import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getLLMFallbackReply(userMessage) {
    const systemPrompt = `You are answering on behalf of ${process.env.YOUR_NAME} on their portfolio site. Be honest if you don't know something specific — say you've noted the question and they'll follow up. Keep it short and friendly.`;

    const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userMessage);
    const text = result.response.text();

    return text || "Thanks for your question — I've noted it and will follow up.";
}