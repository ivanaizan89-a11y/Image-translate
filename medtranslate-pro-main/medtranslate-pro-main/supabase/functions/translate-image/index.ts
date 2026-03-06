import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageNames: Record<string, string> = {
  en: "English",
  ne: "Nepali",
  hi: "Hindi",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  de: "German",
  nl: "Dutch",
  ru: "Russian",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType, targetLanguage, domain } = await req.json();

    if (!imageBase64 || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: imageBase64, targetLanguage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Translation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetLang = languageNames[targetLanguage] || targetLanguage;
    const domainContext = domain === "patient" 
      ? "patient-facing, plain language" 
      : domain === "research" 
        ? "academic and scientific" 
        : "clinical and medical";

    const systemPrompt = `You are an expert medical document translator and OCR specialist.

Your task:
1. Extract ALL text visible in the provided document image
2. Translate the extracted text from its original language to ${targetLang}
3. Use ${domainContext} terminology appropriate for the document type

Format your response as:
---EXTRACTED TEXT---
[The original text from the image]

---TRANSLATION---
[The translated text in ${targetLang}]

Rules:
- Preserve document structure, headings, bullet points, and formatting
- Maintain medical accuracy and terminology consistency
- If a medical term has no direct equivalent, use the internationally recognized term
- For drug names, use International Nonproprietary Names (INN) when applicable
- Do NOT add commentary or explanations outside the two sections above`;

    console.log(`Processing image document for translation to ${targetLang}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/png"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: `Please extract text from this medical document image and translate it to ${targetLang}.`,
              },
            ],
          },
        ],
        temperature: 0.2,
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
          JSON.stringify({ error: "Service quota exceeded. Please check your usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Image translation service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      return new Response(
        JSON.stringify({ error: "No translation received" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse extracted and translated text
    let extractedText = "";
    let translatedText = "";

    const extractedMatch = resultText.match(/---EXTRACTED TEXT---\s*([\s\S]*?)(?=---TRANSLATION---|$)/i);
    const translatedMatch = resultText.match(/---TRANSLATION---\s*([\s\S]*?)$/i);

    if (extractedMatch) extractedText = extractedMatch[1].trim();
    if (translatedMatch) translatedText = translatedMatch[1].trim();

    // Fallback if parsing fails
    if (!translatedText) {
      translatedText = resultText;
    }

    console.log("Image translation successful");
    return new Response(
      JSON.stringify({ extractedText, translatedText, targetLanguage: targetLang }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Image translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
