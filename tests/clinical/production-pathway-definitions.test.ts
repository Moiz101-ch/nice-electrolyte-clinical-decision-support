import { describe, expect, it } from "vitest";

import {
  JBDS_DKA_SOURCE_ID,
  JBDS_DKA_STAGE_SOURCE_REFERENCES,
} from "../../src/clinical/pathways/dka/jbds-calculator.ts";
import { loadPathwayDefinition } from "../../src/clinical/pathways/definition.ts";
import {
  hyponatraemiaEmergencyPathwayDefinition,
  hyponatraemiaInitialAssessmentPathwayDefinition,
  hyponatraemiaManagementPathwayDefinition,
  hyponatraemiaOsmolalityClassificationPathwayDefinition,
  hyponatraemiaSeverityPathwayDefinition,
} from "../../src/clinical/pathways/hyponatraemia/index.ts";
import {
  hyperkalaemiaEcgPathwayDefinition,
  hyperkalaemiaSeverityPathwayDefinition,
  hyperkalaemiaTimedManagementPathwayDefinition,
} from "../../src/clinical/pathways/hyperkalaemia/index.ts";
import {
  hypocalcaemiaAssessmentPathwayDefinition,
  hypocalcaemiaGuardrailPathwayDefinition,
  hypocalcaemiaManagementPathwayDefinition,
} from "../../src/clinical/pathways/hypocalcaemia/index.ts";
import { loadClinicalSourceRegistry } from "../../src/clinical/sources/registry.ts";

const productionDefinitions = [
  hyponatraemiaSeverityPathwayDefinition,
  hyponatraemiaOsmolalityClassificationPathwayDefinition,
  hyponatraemiaInitialAssessmentPathwayDefinition,
  hyponatraemiaEmergencyPathwayDefinition,
  hyponatraemiaManagementPathwayDefinition,
  hyperkalaemiaSeverityPathwayDefinition,
  hyperkalaemiaEcgPathwayDefinition,
  hyperkalaemiaTimedManagementPathwayDefinition,
  hypocalcaemiaAssessmentPathwayDefinition,
  hypocalcaemiaManagementPathwayDefinition,
  hypocalcaemiaGuardrailPathwayDefinition,
] as const;

describe("production pathway definitions", () => {
  it.each(productionDefinitions)(
    "validates $pathwayId against the schema and source registry",
    (definition) => {
      expect(() => loadPathwayDefinition(definition)).not.toThrow();
    },
  );

  it("maps every current DKA calculator stage to its registered immutable source", () => {
    const registry = loadClinicalSourceRegistry();
    const stageReferences = Object.values(JBDS_DKA_STAGE_SOURCE_REFERENCES);

    expect(stageReferences).toHaveLength(6);
    expect(registry.getSource(JBDS_DKA_SOURCE_ID)).toBeDefined();
    for (const references of stageReferences) {
      expect(references.length).toBeGreaterThan(0);
      for (const reference of references) {
        expect(reference.sourceId).toBe(JBDS_DKA_SOURCE_ID);
        expect(reference.location.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
