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

        const { query, restaurants, currentAnalysis, selectedRestaurant } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // Use a fast model
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let currentlyViewing = "";
        if (selectedRestaurant || currentAnalysis) {
            currentlyViewing = `\n[CRITICAL CONTEXT] The user has explicitly selected and is currently looking at this restaurant:\n${selectedRestaurant ? JSON.stringify(selectedRestaurant, null, 2) : ""
                }\n${currentAnalysis ? "Analysis Data for this restaurant:\n" + JSON.stringify(currentAnalysis, null, 2) : ""
                }\nAssume the user's query refers to this restaurant unless they specify otherwise.\n`;
        }

        const prompt = `You are an AI assistant for Praxis Loci, a platform that helps users find and analyze restaurants.
Users can ask for restaurant recommendations, about the data, or general food advice.${currentlyViewing}

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
