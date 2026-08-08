import { createRuleEngine } from "../src/rule-engine/engine.ts";

const engine = createRuleEngine();
const examples = [
  {
    input: {
      ageYears: 74,
      clinicalContext: "iv-fluid-related",
      condition: "hyponatraemia",
      context: {
        alternativeCauseIdentified: false,
        baselineValue: 138,
        egfr: 64,
        fluidStatus: "hypervolaemic",
        ivFluidPrescriptionReviewed: true,
        ivFluidTemporalRelationship: true,
        onIvFluids: true,
      },
      electrolyte: "sodium",
      measuredValue: 129.9,
      unit: "mmol/L",
    },
    name: "IV-fluid hyponatraemia below 130",
  },
  {
    input: {
      ageYears: 62,
      clinicalContext: "iv-fluid-related",
      condition: "hypokalaemia",
      context: {
        adequatePotassiumProvision: false,
        alternativeCauseIdentified: false,
        baselineValue: 4.1,
        egfr: 72,
        ivFluidPrescriptionReviewed: true,
        ivFluidTemporalRelationship: true,
        medicinesReviewed: true,
        onIvFluids: true,
        otherPotassiumLossesIdentified: false,
      },
      electrolyte: "potassium",
      measuredValue: 2.99,
      unit: "mmol/L",
    },
    name: "IV-fluid hypokalaemia below 3.0",
  },
  {
    input: {
      ageYears: 67,
      clinicalContext: "confirmed-primary-hyperparathyroidism",
      condition: "hypercalcaemia",
      context: {
        adjustedCalciumConfirmed: true,
        confirmedPrimaryHyperparathyroidism: true,
        endOrganDisease: false,
        fragilityFractureOrOsteoporosis: false,
        hypercalcaemiaSymptomsPresent: false,
        renalStones: false,
        symptoms: [],
      },
      electrolyte: "calcium",
      measuredValue: 2.85,
      unit: "mmol/L",
    },
    name: "Confirmed PHPT referral boundary",
  },
  {
    input: {
      ageYears: 51,
      clinicalContext: "primary-adrenal-insufficiency",
      condition: "hyponatraemia",
      context: {
        fludrocortisoneDoseStatus: "maximum",
        hyponatraemiaPersistent: true,
        primaryAdrenalInsufficiency: true,
        sodiumTrendReviewed: false,
        specialistEndocrinologyInvolved: true,
      },
      electrolyte: "sodium",
      measuredValue: 132,
      unit: "mmol/L",
    },
    name: "Adrenal context with unreviewed sodium trend",
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
