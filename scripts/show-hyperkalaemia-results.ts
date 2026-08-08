import { createRuleEngine } from "../src/rule-engine/engine.ts";

const engine = createRuleEngine();
const examples = [
  {
    input: {
      ageYears: 68,
      clinicalContext: "ckd-before-raas-antagonist",
      condition: "hyperkalaemia",
      context: {
        ckdStage: "3b",
        raasAntagonistStatus: "planned",
      },
      electrolyte: "potassium",
      measuredValue: 5.01,
      unit: "mmol/L",
    },
    name: "CKD pretreatment boundary",
  },
  {
    input: {
      ageYears: 72,
      clinicalContext: "persistent-hyperkalaemia",
      condition: "hyperkalaemia",
      context: {
        ckdStage: "4",
        dialysis: false,
        heartFailure: false,
        potassiumConfirmed: true,
        raasAntagonistStatus: "not-optimised-because-hyperkalaemia",
      },
      electrolyte: "potassium",
      measuredValue: 5.5,
      unit: "mmol/L",
    },
    name: "Sodium zirconium cyclosilicate eligibility boundary",
  },
  {
    input: {
      ageYears: 59,
      clinicalContext: "aki-not-responding-to-treatment",
      condition: "hyperkalaemia",
      context: {
        aki: true,
        clinicalConditionReviewed: true,
        ecgOrComplicationsReviewed: true,
        fluidStatus: "hypervolaemic",
        medicalManagementResponse: "not-responding",
        potassiumTrendReviewed: true,
        treatmentsReviewed: true,
      },
      electrolyte: "potassium",
      measuredValue: 6.9,
      unit: "mmol/L",
    },
    name: "AKI not responding to medical management",
  },
  {
    input: {
      ageYears: 59,
      clinicalContext: "aki-not-responding-to-treatment",
      condition: "hyperkalaemia",
      context: {
        aki: true,
        medicalManagementResponse: "not-responding",
      },
      electrolyte: "potassium",
      measuredValue: 6.9,
      unit: "mmol/L",
    },
    name: "AKI with incomplete whole-condition review",
  },
] as const;

for (const example of examples) {
  const outcome = engine.evaluate(example.input);

  console.log(`\n${example.name}`);
  console.log(
    JSON.stringify(
      outcome.status === "blocked"
        ? {
            issues: outcome.issues,
            reason: outcome.reason,
            status: outcome.status,
          }
        : {
            managementOutput: outcome.managementOutput,
            ruleId: outcome.ruleId,
            sourceCodes: outcome.sources.map((source) => source.guidanceCode),
            status: outcome.status,
          },
      null,
      2,
    ),
  );
}
