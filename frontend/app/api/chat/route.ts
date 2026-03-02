import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
    try {
        if (!genAI) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set in environment variables." },
                { status: 500 }
            );
        }

        const { query, restaurants } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // Use a fast model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an AI assistant for Anglap.ai, a platform that helps users find and analyze restaurants.
Users can ask for restaurant recommendations, about the data, or general food advice.

Available restaurant data context (Top records, abbreviated): 
${JSON.stringify((restaurants || []).slice(0, 10), null, 2)}

User query: ${query}

Provide a short, helpful, and concise response (max 2-3 sentences). Focus on actionable insight.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return NextResponse.json({ text });
    } catch (error) {
        console.error("AI chat error:", error);
        return NextResponse.json(
            { error: "Failed to generate AI response" },
            { status: 500 }
        );
    }
}
