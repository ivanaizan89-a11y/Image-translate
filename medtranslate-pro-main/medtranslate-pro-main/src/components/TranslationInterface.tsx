import { useState, useMemo } from "react";
import { ArrowRightLeft, Copy, Check, Loader2 } from "lucide-react";
import { analyzeText, type NlpAnalysis } from "@/lib/nlp";
import { NlpInsights } from "./NlpInsights";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "./LanguageSelector";
import { DomainSelector } from "./DomainSelector";

export function TranslationInterface() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("ne");
  const [domain, setDomain] = useState("medical");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const nlpAnalysis = useMemo<NlpAnalysis | null>(() => {
    if (sourceText.trim().length < 10) return null;
    return analyzeText(sourceText);
  }, [sourceText]);

  const handleSwapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "No text to translate",
        description: "Please enter some text to translate.",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    setTranslatedText("");

    try {
      const nlpContext = nlpAnalysis ? {
        medicalTerms: nlpAnalysis.medicalTerms,
        entities: nlpAnalysis.entities.map(e => ({ text: e.text, type: e.type })),
        statistics: nlpAnalysis.statistics,
      } : undefined;

      const { data, error } = await supabase.functions.invoke("translate", {
        body: {
          text: sourceText,
          sourceLanguage,
          targetLanguage,
          domain,
          nlpContext,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setTranslatedText(data.translatedText);
      toast({
        title: "Translation complete",
        description: "Your medical text has been translated successfully.",
      });
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "An error occurred during translation.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "The translated text has been copied.",
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Domain Selection */}
      <DomainSelector value={domain} onChange={setDomain} />

      {/* Language Selection */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <LanguageSelector
          value={sourceLanguage}
          onChange={setSourceLanguage}
          label="Source Language"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSwapLanguages}
          className="rounded-full hover:bg-medical-teal-light transition-all duration-300 hover:scale-110"
          aria-label="Swap languages"
        >
          <ArrowRightLeft className="h-5 w-5 text-primary" />
        </Button>
        <LanguageSelector
          value={targetLanguage}
          onChange={setTargetLanguage}
          label="Target Language"
        />
      </div>

      {/* NLP Insights */}
      {nlpAnalysis && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <NlpInsights analysis={nlpAnalysis} />
          </CardContent>
        </Card>
      )}

      {/* Translation Areas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Source Text */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Source Text
          </label>
          <Textarea
            placeholder="Enter medical text to translate..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="min-h-[300px] resize-none bg-card border-border/50 focus:border-primary/50 transition-colors text-base leading-relaxed"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {sourceText.length} characters
            </span>
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="gradient-medical text-primary-foreground shadow-medical hover:shadow-medical-lg transition-all duration-300"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                "Translate"
              )}
            </Button>
          </div>
        </div>

        {/* Translated Text */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Translation
          </label>
          <div className="relative">
            <Textarea
              placeholder="Translation will appear here..."
              value={translatedText}
              readOnly
              className="min-h-[300px] resize-none bg-medical-teal-light/30 border-border/50 text-base leading-relaxed"
            />
            {isTranslating && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Processing medical terminology...
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {translatedText.length} characters
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!translatedText}
              className="transition-all duration-300"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
