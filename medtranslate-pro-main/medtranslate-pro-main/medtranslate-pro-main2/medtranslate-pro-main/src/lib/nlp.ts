import nlp from "compromise";

export interface NlpAnalysis {
  tokens: { text: string; tags: string[] }[];
  sentences: string[];
  entities: { text: string; type: string }[];
  medicalTerms: string[];
  statistics: {
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
    entityCount: number;
    medicalTermCount: number;
  };
}

// Common medical terms / patterns for extraction
const MEDICAL_PATTERNS = [
  // Conditions & diagnoses
  /\b(diabetes|hypertension|cancer|tumor|malignant|benign|fracture|infection|syndrome|disorder|disease|anemia|asthma|pneumonia|hepatitis|arthritis|dementia|epilepsy|fibrosis|cirrhosis|edema|embolism|thrombosis|sepsis|stenosis|ischemia|neoplasm|carcinoma|melanoma|lymphoma|leukemia|sarcoma)\b/gi,
  // Anatomy
  /\b(cardiac|pulmonary|hepatic|renal|cranial|cerebral|thoracic|abdominal|lumbar|cervical|femoral|tibial|radial|ulnar|vertebral|pelvic|cortical|ventricular|atrial|aortic|bronchial|tracheal)\b/gi,
  // Procedures & treatments
  /\b(biopsy|surgery|resection|transplant|chemotherapy|radiotherapy|dialysis|intubation|catheterization|endoscopy|colonoscopy|mammography|ultrasound|MRI|CT scan|X-ray|ECG|EKG|CBC|infusion|transfusion)\b/gi,
  // Medications & pharmacology
  /\b(mg|ml|mcg|antibiotic|analgesic|antipyretic|antihypertensive|antidiabetic|corticosteroid|immunosuppressant|anticoagulant|diuretic|insulin|metformin|aspirin|ibuprofen|acetaminophen|amoxicillin|prednisone|omeprazole)\b/gi,
  // Clinical terms
  /\b(prognosis|diagnosis|etiology|pathology|symptom|chronic|acute|bilateral|unilateral|postoperative|preoperative|intravenous|subcutaneous|intramuscular|oral|topical|systemic|localized|metastatic|remission|relapse)\b/gi,
  // Lab values
  /\b(hemoglobin|hematocrit|platelet|leukocyte|erythrocyte|creatinine|bilirubin|albumin|glucose|cholesterol|triglyceride|troponin|potassium|sodium|calcium|HbA1c|TSH|PSA|INR)\b/gi,
];

/**
 * Run NLP preprocessing on input text using compromise + medical pattern matching.
 */
export function analyzeText(text: string): NlpAnalysis {
  const doc = nlp(text);

  // Tokenization with POS tags
  const tokens: NlpAnalysis["tokens"] = [];
  doc.terms().forEach((term) => {
    const json = term.json();
    json.forEach((t: { text: string; terms: { tags: string[] }[] }) => {
      t.terms.forEach((w) => {
        tokens.push({ text: t.text, tags: w.tags || [] });
      });
    });
  });

  // Sentence segmentation
  const sentences = doc.sentences().out("array") as string[];

  // Named entity recognition via compromise
  const entities: NlpAnalysis["entities"] = [];

  // People
  doc.people().forEach((p) => {
    entities.push({ text: p.text(), type: "Person" });
  });

  // Places
  doc.places().forEach((p) => {
    entities.push({ text: p.text(), type: "Place" });
  });

  // Organizations
  doc.organizations().forEach((o) => {
    entities.push({ text: o.text(), type: "Organization" });
  });

  // Nouns (potential medical entities)
  doc.nouns().forEach((n) => {
    const t = n.text();
    if (t.length > 3 && !entities.find((e) => e.text === t)) {
      // Check if it looks like a proper noun or capitalized term
      if (/^[A-Z]/.test(t)) {
        entities.push({ text: t, type: "Noun Phrase" });
      }
    }
  });

  // Medical term extraction via regex patterns
  const medicalTermSet = new Set<string>();
  for (const pattern of MEDICAL_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((m) => medicalTermSet.add(m.toLowerCase()));
    }
  }

  // Also check for dose patterns like "500mg", "10ml"
  const doseMatches = text.match(/\b\d+\s*(mg|ml|mcg|units|IU|mmol|mEq)\b/gi);
  if (doseMatches) {
    doseMatches.forEach((m) => medicalTermSet.add(m));
  }

  const medicalTerms = Array.from(medicalTermSet);
  const wordCount = doc.wordCount();

  return {
    tokens,
    sentences,
    entities,
    medicalTerms,
    statistics: {
      wordCount,
      sentenceCount: sentences.length,
      avgWordsPerSentence: sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0,
      entityCount: entities.length,
      medicalTermCount: medicalTerms.length,
    },
  };
}
