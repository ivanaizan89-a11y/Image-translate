import { useState, useRef } from "react";
import { Upload, ImageIcon, Loader2, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "./LanguageSelector";
import { DomainSelector } from "./DomainSelector";
import { cn } from "@/lib/utils";

export function ImageTranslation() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/png");
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("ne");
  const [domain, setDomain] = useState("medical");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, WEBP, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);

    setExtractedText("");
    setTranslatedText("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleTranslateImage = async () => {
    if (!imageBase64) {
      toast({
        title: "No image uploaded",
        description: "Please upload a document image first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setExtractedText("");
    setTranslatedText("");

    try {
      const { data, error } = await supabase.functions.invoke("translate-image", {
        body: { imageBase64, mimeType, targetLanguage, domain },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setExtractedText(data.extractedText || "");
      setTranslatedText(data.translatedText || "");
      toast({
        title: "Document translated",
        description: "Your document image has been processed and translated.",
      });
    } catch (error) {
      console.error("Image translation error:", error);
      toast({
        title: "Translation failed",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleClear = () => {
    setImagePreview(null);
    setImageBase64(null);
    setExtractedText("");
    setTranslatedText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      <DomainSelector value={domain} onChange={setDomain} />

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Document Image
          </label>
          <div className="w-[180px] h-10 flex items-center justify-center rounded-md bg-card border border-border/50 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4 mr-2" />
            Auto-detect
          </div>
        </div>
        <div className="flex items-center justify-center w-10 h-10 mt-6">
          <span className="text-primary font-bold">→</span>
        </div>
        <LanguageSelector
          value={targetLanguage}
          onChange={setTargetLanguage}
          label="Target Language"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Document Image
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
            className={cn(
              "min-h-[300px] rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden",
              isDragOver
                ? "border-primary bg-medical-teal-light"
                : imagePreview
                  ? "border-border/50 bg-card"
                  : "border-border/50 bg-card hover:border-primary/30 hover:bg-medical-teal-light/20 cursor-pointer"
            )}
          >
            {imagePreview ? (
              <div className="relative w-full h-full min-h-[300px]">
                <img
                  src={imagePreview}
                  alt="Uploaded document"
                  className="w-full h-full object-contain p-2"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="p-4 rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Drop your document image here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse (PNG, JPG, WEBP — max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleTranslateImage}
              disabled={isProcessing || !imageBase64}
              className="gradient-medical text-primary-foreground shadow-medical hover:shadow-medical-lg transition-all duration-300"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Extract & Translate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Results
          </label>
          <div className="relative min-h-[300px] rounded-xl border border-border/50 bg-medical-teal-light/30 p-4 overflow-auto">
            {isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Extracting &amp; translating document...
                  </span>
                </div>
              </div>
            ) : extractedText || translatedText ? (
              <div className="space-y-4 text-sm">
                {extractedText && (
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1 text-xs uppercase tracking-wider">
                      Extracted Text
                    </h4>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {extractedText}
                    </p>
                  </div>
                )}
                {translatedText && (
                  <div className="border-t border-border/50 pt-4">
                    <h4 className="font-semibold text-primary mb-1 text-xs uppercase tracking-wider">
                      Translation
                    </h4>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {translatedText}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[260px] text-muted-foreground text-sm">
                Upload a document image and click "Extract & Translate"
              </div>
            )}
          </div>
          <div className="flex justify-end">
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
                  Copy Translation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
