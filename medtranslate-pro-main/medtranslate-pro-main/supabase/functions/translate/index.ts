import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NlpContext {
  medicalTerms?: string[];
  entities?: { text: string; type: string }[];
  statistics?: { wordCount: number; sentenceCount: number; medicalTermCount: number };
}

interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  domain: string;
  nlpContext?: NlpContext;
}

const domainPrompts: Record<string, string> = {
  medical: `You are a specialized medical translator with expertise in clinical terminology, pharmaceutical terms, and healthcare documentation. 
Focus on:
- Accurate translation of medical terminology (diseases, symptoms, treatments, medications)
- Preserving clinical precision and avoiding ambiguity
- Maintaining proper medical nomenclature in the target language
- Using standard medical abbreviations where appropriate
- Ensuring patient safety by precise translation of dosages, procedures, and instructions`,
  
  patient: `You are a medical translator specializing in patient-facing communications. 
Focus on:
- Translating complex medical terms into plain, understandable language
- Maintaining accuracy while ensuring comprehension for non-medical readers
- Using culturally appropriate language for patient instructions
- Preserving important safety information and warnings
- Making the translation accessible and clear for patients of all literacy levels`,
  
  research: `You are an academic medical translator specializing in research and scientific publications.
Focus on:
- Precise translation of scientific terminology and methodology
- Maintaining academic tone and style conventions
- Accurate translation of statistical terms and research concepts
- Preserving citations and reference formatting conventions
- Ensuring consistency with standard scientific nomenclature`,
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
    const { text, sourceLanguage, targetLanguage, domain, nlpContext } = await req.json() as TranslationRequest;

    if (!text || !sourceLanguage || !targetLanguage || !domain) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text, sourceLanguage, targetLanguage, domain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Translation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourceLang = languageNames[sourceLanguage] || sourceLanguage;
    const targetLang = languageNames[targetLanguage] || targetLanguage;
    const domainContext = domainPrompts[domain] || domainPrompts.medical;

    let nlpEnrichment = "";
    if (nlpContext) {
      if (nlpContext.medicalTerms?.length) {
        nlpEnrichment += `\n\nNLP PREPROCESSING DETECTED THE FOLLOWING MEDICAL TERMS (ensure these are translated with maximum precision): ${nlpContext.medicalTerms.join(", ")}`;
      }
      if (nlpContext.entities?.length) {
        nlpEnrichment += `\n\nDETECTED NAMED ENTITIES (preserve or transliterate appropriately): ${nlpContext.entities.map(e => `${e.text} (${e.type})`).join(", ")}`;
      }
    }

    const systemPrompt = `${domainContext}

CRITICAL INSTRUCTIONS:
1. Translate the following text from ${sourceLang} to ${targetLang}
2. Maintain medical accuracy and terminology consistency
3. Do NOT add explanations, notes, or commentary - provide ONLY the translation
4. Preserve formatting, bullet points, and structure where present
5. If a medical term has no direct equivalent, use the internationally recognized term with a brief parenthetical explanation in the target language if necessary
6. For drug names, use the International Nonproprietary Name (INN) when applicable${nlpEnrichment}`;

    console.log(`Translating from ${sourceLang} to ${targetLang} in ${domain} domain`);

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
          { role: "user", content: text },
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
        JSON.stringify({ error: "Translation service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content;

    if (!translatedText) {
      return new Response(
        JSON.stringify({ error: "No translation received" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Translation successful");
    return new Response(
      JSON.stringify({ 
        translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        domain 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
