import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, nlpContext } = await req.json();

    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: "Please provide medical text to analyze." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Analysis service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let nlpEnrichment = "";
    if (nlpContext) {
      if (nlpContext.medicalTerms?.length) {
        nlpEnrichment += `\n\nNLP PREPROCESSING has identified these medical terms in the text — use them to inform your classification: ${nlpContext.medicalTerms.join(", ")}`;
      }
      if (nlpContext.entities?.length) {
        nlpEnrichment += `\n\nDETECTED NAMED ENTITIES: ${nlpContext.entities.map((e: {text: string; type: string}) => `${e.text} (${e.type})`).join(", ")}`;
      }
      if (nlpContext.statistics) {
        nlpEnrichment += `\n\nTEXT STATISTICS: ${nlpContext.statistics.wordCount} words, ${nlpContext.statistics.sentenceCount} sentences, ${nlpContext.statistics.medicalTermCount} medical terms detected`;
      }
    }

    const systemPrompt = `You are a medical document sentiment analyzer. Your job is to classify medical documentation into one of three categories based on the nature of the news it conveys to the patient or healthcare professional.

Categories:
- GOOD: Positive outcomes, recovery, improvement, normal results, successful treatments, benign findings, favorable prognosis
- NEUTRAL: Routine findings, stable conditions, standard procedures, follow-up needed, monitoring required, inconclusive results
- BAD: Serious diagnoses, deterioration, adverse events, critical findings, poor prognosis, complications, malignant findings

You MUST respond with ONLY valid JSON in this exact format:
{
  "classification": "GOOD" | "NEUTRAL" | "BAD",
  "confidence": <number 0-100>,
  "summary": "<brief 1-2 sentence explanation of why this classification was chosen>",
  "key_indicators": ["<indicator1>", "<indicator2>", "<indicator3>"]
}

Do NOT include any text outside the JSON. Analyze the medical context carefully.${nlpEnrichment}`;

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
        temperature: 0.1,
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
          JSON.stringify({ error: "Service quota exceeded." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Analysis service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No analysis received" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from the AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Failed to parse analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
