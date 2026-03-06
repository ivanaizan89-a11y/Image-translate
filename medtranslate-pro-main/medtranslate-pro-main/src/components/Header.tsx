import { Activity, Shield } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-medical shadow-medical">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MedTranslate</h1>
              <p className="text-xs text-muted-foreground">
                Medical Language Translation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Domain-Specific NLP</span>
          </div>
        </div>
      </div>
    </header>
  );
}
