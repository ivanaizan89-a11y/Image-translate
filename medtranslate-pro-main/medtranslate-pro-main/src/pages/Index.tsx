import { Header } from "@/components/Header";
import { TranslationInterface } from "@/components/TranslationInterface";
import { ImageTranslation } from "@/components/ImageTranslation";
import { DocumentAnalysis } from "@/components/DocumentAnalysis";
import { Features } from "@/components/Features";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ImageIcon, Activity } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Reliable Medical Language{" "}
            <span className="text-primary">Translation</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Domain-specific NLP system designed for accurate translations of medical
            documents, patient instructions, and research articles. Powered by
            transformer-based models with integrated medical terminology.
          </p>
        </div>

        {/* Translation Tabs */}
        <Tabs defaultValue="text" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full max-w-xl mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text Translation
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image Document
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              News Detection
            </TabsTrigger>
          </TabsList>
          <TabsContent value="text">
            <TranslationInterface />
          </TabsContent>
          <TabsContent value="image">
            <ImageTranslation />
          </TabsContent>
          <TabsContent value="analysis">
            <DocumentAnalysis />
          </TabsContent>
        </Tabs>

        {/* Features Section */}
        <Features />

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border/40 mt-8">
          <p className="text-sm text-muted-foreground">
            Built with advanced NLP technology for healthcare professionals and researchers
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
