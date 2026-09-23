import {
  loadPathwayDefinition,
  type LoadPathwayDefinitionOptions,
} from "../pathways/definition.ts";
import type { PathwayEngine } from "./types.ts";
import { createPrevalidatedPathwayEngine } from "./engine.ts";

export function createPathwayEngine(
  definitionInput: unknown,
  options: LoadPathwayDefinitionOptions = {},
): PathwayEngine {
  return createPrevalidatedPathwayEngine(loadPathwayDefinition(definitionInput, options));
}
