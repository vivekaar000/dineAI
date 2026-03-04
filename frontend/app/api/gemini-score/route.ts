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

        const { analysis, restaurant } = await req.json();

        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant context is required" }, { status: 400 });
        }

        // Use a fast model
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `You are a world-class restaurant intelligence system known as Praxis Loci.
Your task is to calculate a highly accurate "Tourist Targeting Score" (TTS) from 0 to 100.
0 = A completely hidden, authentic local secret.
100 = A pure tourist trap designed solely to extract money from out-of-town visitors.

You are given a base algorithmic score out of 100, plus the restaurant's metadata. 
Evaluate the restaurant's name, cuisine, location, and the pre-computed algorithmic signals.
Is this actually a famous tourist trap (like a Hard Rock Cafe or a Broadway Honky Tonk)?
Or is it a respected local establishment that the algorithm might have misidentified?

Restaurant Metadata:
${JSON.stringify(restaurant, null, 2)}

Algorithmic Analysis Result:
${JSON.stringify(analysis, null, 2)}

Respond with ONLY a raw JSON object containing the improved scores, nothing else. Do not use markdown syntax.
Example format:
{
  "tts_score": 85,
  "local_authenticity_score": 15,
  "predicted_label": "tourist",
  "reasoning": "Located directly on the main tourist strip and is a known national chain."
}
`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();

        // Strip markdown code block if present
        if (text.startsWith("\`\`\`json")) text = text.replace("\`\`\`json", "");
        if (text.startsWith("\`\`\`")) text = text.replace("\`\`\`", "");
        if (text.endsWith("\`\`\`")) text = text.slice(0, -3);
        text = text.trim();

        const data = JSON.parse(text);

        // Ensure valid formatting
        const tts = Math.max(0, Math.min(100, Number(data.tts_score) || 0));
        let label = "mixed";
        if (tts >= 65) label = "tourist";
        else if (tts <= 40) label = "local";

        return NextResponse.json({
            tts_score: tts,
            local_authenticity_score: 100 - tts,
            predicted_label: label,
            reasoning: data.reasoning || "Analyzed by AI"
        });
    } catch (error) {
        console.error("Gemini Scoring error:", error);
        return NextResponse.json(
            { error: "Failed to generate improved Gemini score" },
            { status: 500 }
        );
    }
}
