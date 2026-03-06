import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NlpAnalysis } from "@/lib/nlp";
import { Brain, Hash, FileText, Stethoscope, Tag } from "lucide-react";

interface NlpInsightsProps {
  analysis: NlpAnalysis | null;
  className?: string;
}

export function NlpInsights({ analysis, className }: NlpInsightsProps) {
  if (!analysis) return null;

  const { statistics, medicalTerms, entities } = analysis;

  return (
    <div className={cn("space-y-3 animate-fade-in", className)}>
      <div className="flex items-center gap-2 mb-1">
        <Brain className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          NLP Preprocessing
        </h4>
      </div>

      {/* Statistics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard icon={Hash} label="Words" value={statistics.wordCount} />
        <StatCard icon={FileText} label="Sentences" value={statistics.sentenceCount} />
        <StatCard icon={Tag} label="Entities" value={statistics.entityCount} />
        <StatCard icon={Stethoscope} label="Medical Terms" value={statistics.medicalTermCount} />
      </div>

      {/* Medical terms */}
      {medicalTerms.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-1.5">
            Detected Medical Terms
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {medicalTerms.slice(0, 20).map((term, i) => (
              <Badge
                key={i}
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-xs"
              >
                {term}
              </Badge>
            ))}
            {medicalTerms.length > 20 && (
              <Badge variant="secondary" className="text-xs">
                +{medicalTerms.length - 20} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Named entities */}
      {entities.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-1.5">
            Named Entities (NER)
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {entities.slice(0, 15).map((entity, i) => (
              <Badge
                key={i}
                variant="outline"
                className="bg-accent text-accent-foreground border-border text-xs"
              >
                <span className="font-semibold">{entity.text}</span>
                <span className="ml-1 opacity-60">({entity.type})</span>
              </Badge>
            ))}
            {entities.length > 15 && (
              <Badge variant="secondary" className="text-xs">
                +{entities.length - 15} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: number }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-2.5 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <div>
          <p className="text-sm font-bold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
