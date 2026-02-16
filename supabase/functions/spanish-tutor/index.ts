import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatRequest {
  message: string;
  mode: "coach" | "free";
  topic: string;
  conversationHistory: { role: string; content: string }[];
  userLevel: string;
  coachStyle: string;
  explainInEnglish: boolean;
  targetLanguage: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { 
      message, 
      mode, 
      topic, 
      conversationHistory = [], 
      userLevel = "beginner",
      coachStyle = "gentle",
      explainInEnglish = true,
      targetLanguage = "spanish",
    }: ChatRequest = await req.json();

    const systemPrompt = buildSystemPrompt(mode, topic, userLevel, coachStyle, explainInEnglish, targetLanguage);

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tutor error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(
  mode: string, 
  topic: string, 
  userLevel: string, 
  coachStyle: string,
  explainInEnglish: boolean,
  targetLanguage: string,
): string {
  const langNames: Record<string, string> = {
    spanish: "Spanish",
    french: "French",
    italian: "Italian",
    english: "English",
  };
  const langName = langNames[targetLanguage] || "Spanish";

  const levelInstructions: Record<string, string> = {
    beginner: `
- Use simple vocabulary and short sentences
- Focus on present tense verbs and basic grammar
- Emphasize basic greetings, numbers, and common phrases
- Avoid complex grammar
`,
    intermediate: `
- Use more varied vocabulary
- Include past tense basics
- Introduce common connectors
- Can discuss more abstract topics
`,
    advanced: `
- Use sophisticated vocabulary and idioms
- Include all tenses including subjunctive/conditional
- Discuss complex topics naturally
- Minimal simplification needed
`,
  };

  const topicContext: Record<string, string> = {
    general: "general conversation practice",
    travel: "travel, directions, transportation, and tourism",
    food: "food, restaurants, ordering, and cooking",
    introductions: "meeting people, introductions, and small talk",
    shopping: "shopping, prices, and transactions",
    daily: "daily routine, work, school, and hobbies",
  };

  const basePrompt = `You are Language Buddy, a friendly and encouraging ${langName} language tutor. Your primary language of instruction is ${langName}, with English support when needed.

**Target Language:** ${langName}
**User Level:** ${userLevel}
${levelInstructions[userLevel] || levelInstructions.beginner}

**Current Topic:** ${topicContext[topic] || "general conversation"}

**Coach Style:** ${coachStyle === "strict" ? "Direct and detailed corrections" : "Encouraging with gentle corrections"}

**Language Preference:** ${explainInEnglish ? "Include brief English explanations when helpful" : `Respond primarily in ${langName}`}
`;

  if (mode === "coach") {
    return basePrompt + `
**MODE: COACH (Correction Mode)**

When the user writes in ${langName}, ALWAYS respond with this structure:
1. ✅ **Corrected version:** [corrected version if needed, or "Perfect!" if correct]
2. 🛠 **What to change:** [1-2 bullet points explaining key corrections, if any]
3. 🔁 **Try again:** [give a similar sentence for them to try]
4. ❓ [Ask a follow-up question to continue the conversation]

If the user writes in English asking about ${langName}:
- Provide the translation
- Explain any grammar points briefly
- Give a practice sentence

Keep responses concise but educational. Celebrate progress with emojis!`;
  } else {
    return basePrompt + `
**MODE: FREE CHAT (Natural Conversation)**

Have a natural conversation in ${langName}. DO NOT correct mistakes unless the user explicitly asks.

Guidelines:
- Keep the conversation flowing naturally
- Respond to what they say, don't lecture
- Use appropriate vocabulary for their level
- If they seem stuck, offer a helpful phrase they could use
- Only switch to correction mode if they ask

Be friendly, engaging, and make the conversation enjoyable!`;
  }
}
