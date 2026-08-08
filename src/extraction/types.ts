export type ExtractionStatus = "confirmed" | "missing" | "conflicting" | "uncertain";

export interface ExtractionEvidence {
  end: number;
  start: number;
  text: string;
}

export interface ExtractedField<T> {
  candidates: T[];
  evidence: ExtractionEvidence[];
  status: ExtractionStatus;
  value: T | null;
}

export interface ExtractedList<T> {
  evidence: ExtractionEvidence[];
  status: ExtractionStatus;
  values: T[];
}

export interface ExtractionConflict {
  candidates: string[];
  evidence: ExtractionEvidence[];
  field: string;
}

export type Electrolyte = "sodium" | "potassium" | "calcium" | "magnesium";

export type StatedCondition =
  | "hyponatraemia"
  | "hypernatraemia"
  | "hypokalaemia"
  | "hyperkalaemia"
  | "hypocalcaemia"
  | "hypercalcaemia"
  | "hypomagnesaemia"
  | "hypermagnesaemia"
  | "no-abnormality";

export type CkdStage = "none" | "1" | "2" | "3a" | "3b" | "4" | "5";

export type ClinicalContext =
  | "general-adult-presentation"
  | "acute-life-threatening-hyperkalaemia"
  | "iv-fluid-related"
  | "ckd-raas-monitoring"
  | "ckd-before-raas-antagonist"
  | "ckd-on-raas-antagonist"
  | "persistent-hyperkalaemia"
  | "aki-not-responding-to-treatment"
  | "possible-primary-hyperparathyroidism"
  | "confirmed-primary-hyperparathyroidism"
  | "primary-adrenal-insufficiency";

export type MedicineCategory = "raas-antagonist" | "hyperkalaemia-promoting";

export interface RecognisedMedicine {
  category: MedicineCategory;
  name: string;
  negated: boolean;
}

export interface DeterministicExtraction {
  age: ExtractedField<number>;
  baselineUnit: ExtractedField<"mmol/L">;
  baselineValue: ExtractedField<number>;
  ckdStage: ExtractedField<CkdStage>;
  clinicalContext: ExtractedField<ClinicalContext>;
  conflicts: ExtractionConflict[];
  dialysis: ExtractedField<boolean>;
  egfr: ExtractedField<number>;
  egfrUnit: ExtractedField<"mL/min/1.73m2">;
  electrolyte: ExtractedField<Electrolyte>;
  ivFluidContainsSaline: ExtractedField<boolean>;
  onIvFluids: ExtractedField<boolean>;
  raasAntagonistUse: ExtractedField<boolean>;
  recognisedMedicines: ExtractedList<RecognisedMedicine>;
  statedCondition: ExtractedField<StatedCondition>;
  unit: ExtractedField<"mmol/L">;
  value: ExtractedField<number>;
}
