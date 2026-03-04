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

        const prompt = `You are an AI assistant integrated into Praxis Loci, a platform for exploring and analyzing restaurants.
While you have access to local restaurant data, you are a fully capable general AI. You can answer ANY question the user asks, whether it's about the restaurant data, general food advice, geography, history, coding, or anything else entirely. Feel free to use your broader knowledge to offer rich and helpful answers.${currentlyViewing}

Available restaurant data context (Top records, abbreviated): 
${JSON.stringify((restaurants || []).slice(0, 10), null, 2)}

User query: ${query}

Provide a helpful, precise, and concise response. Keep it brief (max 3-4 sentences) unless the user asks for more detail. Use markdown formatting where appropriate.`;

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
