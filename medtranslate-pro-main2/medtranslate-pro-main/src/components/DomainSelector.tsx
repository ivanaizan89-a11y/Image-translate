import { FileText, Users, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface DomainSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const domains = [
  {
    id: "medical",
    name: "Medical Documents",
    description: "Clinical reports, diagnoses, treatment plans",
    icon: FileText,
  },
  {
    id: "patient",
    name: "Patient Instructions",
    description: "Medication guides, care instructions, consent forms",
    icon: Users,
  },
  {
    id: "research",
    name: "Research Articles",
    description: "Scientific papers, clinical studies, journals",
    icon: GraduationCap,
  },
];

export function DomainSelector({ value, onChange }: DomainSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-muted-foreground">
        Select Document Type
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {domains.map((domain) => {
          const Icon = domain.icon;
          const isSelected = value === domain.id;
          return (
            <button
              key={domain.id}
              onClick={() => onChange(domain.id)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-300 text-left",
                isSelected
                  ? "border-primary bg-medical-teal-light shadow-medical"
                  : "border-border/50 bg-card hover:border-primary/30 hover:shadow-soft"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className={cn(
                    "font-semibold transition-colors",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {domain.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {domain.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
