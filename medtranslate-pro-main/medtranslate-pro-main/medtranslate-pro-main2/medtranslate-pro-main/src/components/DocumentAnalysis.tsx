import { useState, useMemo } from "react";
import { Loader2, ThumbsUp, Minus, AlertTriangle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { analyzeText, type NlpAnalysis } from "@/lib/nlp";
import { NlpInsights } from "./NlpInsights";

interface AnalysisResult {
  classification: "GOOD" | "NEUTRAL" | "BAD";
  confidence: number;
  summary: string;
  key_indicators: string[];
}

const classificationConfig = {
  GOOD: {
    label: "Good News",
    icon: ThumbsUp,
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    textClass: "text-emerald-700 dark:text-emerald-400",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
    barClass: "bg-emerald-500",
  },
  NEUTRAL: {
    label: "Neutral / Routine",
    icon: Minus,
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    borderClass: "border-amber-200 dark:border-amber-800",
    textClass: "text-amber-700 dark:text-amber-400",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-700",
    barClass: "bg-amber-500",
  },
  BAD: {
    label: "Concerning News",
    icon: AlertTriangle,
    bgClass: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-red-200 dark:border-red-800",
    textClass: "text-red-700 dark:text-red-400",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-700",
    barClass: "bg-red-500",
  },
};

export function DocumentAnalysis() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const nlpAnalysis = useMemo<NlpAnalysis | null>(() => {
    if (text.trim().length < 10) return null;
    return analyzeText(text);
  }, [text]);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({
        title: "No text to analyze",
        description: "Please enter medical documentation text.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const nlpContext = nlpAnalysis ? {
        medicalTerms: nlpAnalysis.medicalTerms,
        entities: nlpAnalysis.entities.map(e => ({ text: e.text, type: e.type })),
        statistics: nlpAnalysis.statistics,
      } : undefined;

      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { text, nlpContext },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setResult(data as AnalysisResult);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const config = result ? classificationConfig[result.classification] : null;
  const Icon = config?.icon;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* NLP Insights */}
      {nlpAnalysis && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <NlpInsights analysis={nlpAnalysis} />
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Medical Documentation
          </label>
          <Textarea
            placeholder="Paste medical documentation, lab results, clinical notes, or diagnosis reports here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[300px] resize-none bg-card border-border/50 focus:border-primary/50 transition-colors text-base leading-relaxed"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {text.length} characters
            </span>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="gradient-medical text-primary-foreground shadow-medical hover:shadow-medical-lg transition-all duration-300"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Analyze Document
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Analysis Result
          </label>
          <div className="relative min-h-[300px] rounded-xl border border-border/50 bg-medical-teal-light/30 p-4 overflow-auto">
            {isAnalyzing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Analyzing medical documentation...
                  </span>
                </div>
              </div>
            ) : result && config && Icon ? (
              <div className="space-y-4 animate-fade-in">
                {/* Classification badge */}
                <Card className={cn("border-2", config.borderClass, config.bgClass)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className={cn("h-8 w-8", config.textClass)} />
                    <div className="flex-1">
                      <h3 className={cn("text-lg font-bold", config.textClass)}>
                        {config.label}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", config.barClass)}
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                        <span className={cn("text-sm font-semibold", config.textClass)}>
                          {result.confidence}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <div>
                  <h4 className="font-semibold text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                    Summary
                  </h4>
                  <p className="text-foreground text-sm leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                {/* Key indicators */}
                {result.key_indicators?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                      Key Indicators
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.key_indicators.map((indicator, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className={config.badgeClass}
                        >
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[260px] text-muted-foreground text-sm">
                Paste medical text and click "Analyze Document" to classify
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
