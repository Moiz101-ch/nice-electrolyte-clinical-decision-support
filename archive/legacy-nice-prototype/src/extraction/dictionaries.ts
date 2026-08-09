import type { ClinicalContext, Electrolyte, MedicineCategory, StatedCondition } from "./types";

export interface TerminologyEntry<T> {
  aliases: string[];
  value: T;
}

export const electrolyteTerms: TerminologyEntry<Electrolyte>[] = [
  { value: "sodium", aliases: ["sodium", "na"] },
  { value: "potassium", aliases: ["potassium", "k"] },
  { value: "calcium", aliases: ["adjusted calcium", "corrected calcium", "calcium", "ca"] },
  { value: "magnesium", aliases: ["magnesium", "mg"] },
];

export const conditionTerms: TerminologyEntry<StatedCondition>[] = [
  { value: "hyponatraemia", aliases: ["hyponatraemia", "hyponatremia"] },
  { value: "hypernatraemia", aliases: ["hypernatraemia", "hypernatremia"] },
  { value: "hypokalaemia", aliases: ["hypokalaemia", "hypokalemia"] },
  { value: "hyperkalaemia", aliases: ["hyperkalaemia", "hyperkalemia"] },
  { value: "hypocalcaemia", aliases: ["hypocalcaemia", "hypocalcemia"] },
  { value: "hypercalcaemia", aliases: ["hypercalcaemia", "hypercalcemia"] },
  { value: "hypomagnesaemia", aliases: ["hypomagnesaemia", "hypomagnesemia"] },
  { value: "hypermagnesaemia", aliases: ["hypermagnesaemia", "hypermagnesemia"] },
  {
    value: "no-abnormality",
    aliases: [
      "no detected sodium abnormality",
      "no detected potassium abnormality",
      "no detected adjusted calcium abnormality",
      "no detected magnesium abnormality",
      "no electrolyte abnormality",
      "normal sodium",
      "normal potassium",
      "normal calcium",
      "normal magnesium",
    ],
  },
];

export const clinicalContextTerms: TerminologyEntry<ClinicalContext>[] = [
  { value: "general-adult-presentation", aliases: ["general adult presentation"] },
  {
    value: "acute-life-threatening-hyperkalaemia",
    aliases: [
      "acute life-threatening hyperkalaemia",
      "acute life threatening hyperkalaemia",
      "acute life-threatening hyperkalemia",
      "acute life threatening hyperkalemia",
    ],
  },
  { value: "iv-fluid-related", aliases: ["iv-fluid-related", "iv fluid related"] },
  { value: "ckd-raas-monitoring", aliases: ["ckd raas monitoring"] },
  {
    value: "ckd-before-raas-antagonist",
    aliases: ["ckd before raas antagonist", "ckd before a raas antagonist"],
  },
  {
    value: "ckd-on-raas-antagonist",
    aliases: ["ckd on raas antagonist", "ckd taking a raas antagonist"],
  },
  {
    value: "persistent-hyperkalaemia",
    aliases: ["persistent hyperkalaemia", "persistent hyperkalemia"],
  },
  {
    value: "aki-not-responding-to-treatment",
    aliases: ["aki not responding to treatment", "aki not responding to medical management"],
  },
  {
    value: "possible-primary-hyperparathyroidism",
    aliases: ["possible primary hyperparathyroidism"],
  },
  {
    value: "confirmed-primary-hyperparathyroidism",
    aliases: ["confirmed primary hyperparathyroidism"],
  },
  { value: "primary-adrenal-insufficiency", aliases: ["primary adrenal insufficiency"] },
];

export interface MedicineEntry {
  aliases: string[];
  category: MedicineCategory;
  name: string;
}

export const medicineDictionary: MedicineEntry[] = [
  {
    name: "ACE inhibitor",
    category: "raas-antagonist",
    aliases: [
      "ace inhibitor",
      "ramipril",
      "lisinopril",
      "enalapril",
      "perindopril",
      "captopril",
      "fosinopril",
      "quinapril",
    ],
  },
  {
    name: "ARB",
    category: "raas-antagonist",
    aliases: [
      "arb",
      "angiotensin receptor blocker",
      "losartan",
      "candesartan",
      "valsartan",
      "irbesartan",
      "telmisartan",
      "olmesartan",
    ],
  },
  {
    name: "RAAS antagonist",
    category: "raas-antagonist",
    aliases: ["raas antagonist", "raas inhibitor", "renin-angiotensin system antagonist"],
  },
  {
    name: "mineralocorticoid receptor antagonist",
    category: "hyperkalaemia-promoting",
    aliases: ["spironolactone", "eplerenone", "mineralocorticoid receptor antagonist"],
  },
  {
    name: "potassium-sparing diuretic",
    category: "hyperkalaemia-promoting",
    aliases: ["amiloride", "triamterene", "potassium-sparing diuretic"],
  },
  {
    name: "trimethoprim-containing medicine",
    category: "hyperkalaemia-promoting",
    aliases: ["trimethoprim", "co-trimoxazole"],
  },
  {
    name: "NSAID",
    category: "hyperkalaemia-promoting",
    aliases: ["nsaid", "ibuprofen", "naproxen", "diclofenac"],
  },
  {
    name: "potassium supplement",
    category: "hyperkalaemia-promoting",
    aliases: ["potassium supplement", "potassium chloride"],
  },
];
