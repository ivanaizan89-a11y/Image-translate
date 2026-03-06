import { Brain, Languages, BookOpen, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Transformer-Based AI",
    description: "Powered by state-of-the-art NLP models fine-tuned for medical terminology",
  },
  {
    icon: Languages,
    title: "Multi-Language Support",
    description: "Accurate translations between English, Nepali, Hindi, and French",
  },
  {
    icon: BookOpen,
    title: "Domain-Specific Dictionaries",
    description: "Integrated medical terminology databases for precise translations",
  },
  {
    icon: Zap,
    title: "Context-Aware",
    description: "Understands clinical context to provide appropriate translations",
  },
];

export function Features() {
  return (
    <section className="py-12 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Specialized Medical Translation
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our system addresses limitations of general-purpose translation tools with
            domain-specific terminology handling and context sensitivity.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border/50 shadow-soft hover:shadow-soft-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-3 rounded-lg bg-medical-teal-light w-fit mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
