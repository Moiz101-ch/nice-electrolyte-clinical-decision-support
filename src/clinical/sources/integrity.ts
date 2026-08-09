import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";

import type { ClinicalSourceRegistry } from "./registry.ts";

const sourceFileExtensions = new Set([".jpeg", ".pdf"]);

export interface VerifiedClinicalSource {
  readonly localPath: string;
  readonly sha256: string;
  readonly sourceId: string;
}

export async function verifyClinicalSourceIntegrity(
  registry: ClinicalSourceRegistry,
  repositoryRoot: string,
): Promise<readonly VerifiedClinicalSource[]> {
  const sourcesRoot = resolve(repositoryRoot, "clinical-sources");
  const verified: VerifiedClinicalSource[] = [];

  for (const source of registry.sources) {
    const absolutePath = resolve(repositoryRoot, source.localPath);
    assertInsideSourcesRoot(absolutePath, sourcesRoot, source.sourceId);

    const fileStats = await stat(absolutePath);

    if (!fileStats.isFile()) {
      throw new Error(`${source.sourceId} does not reference a regular file.`);
    }

    if (fileStats.size !== source.fileSizeBytes) {
      throw new Error(
        `${source.sourceId} size mismatch: expected ${source.fileSizeBytes}, received ${fileStats.size}.`,
      );
    }

    const content = await readFile(absolutePath);
    const sha256 = createHash("sha256").update(content).digest("hex").toUpperCase();

    if (sha256 !== source.sha256) {
      throw new Error(`${source.sourceId} SHA-256 mismatch.`);
    }

    verified.push(
      Object.freeze({ localPath: source.localPath, sha256, sourceId: source.sourceId }),
    );
  }

  const registeredPaths = new Set(registry.sources.map((source) => source.localPath));
  const sourceFiles = await listSourceFiles(sourcesRoot, repositoryRoot);
  const unregisteredFiles = sourceFiles.filter((path) => !registeredPaths.has(path));

  if (unregisteredFiles.length > 0) {
    throw new Error(`Unregistered clinical source files:\n${unregisteredFiles.join("\n")}`);
  }

  return Object.freeze(verified);
}

function assertInsideSourcesRoot(
  absolutePath: string,
  sourcesRoot: string,
  sourceId: string,
): void {
  const relativePath = relative(sourcesRoot, absolutePath);

  if (
    relativePath.length === 0 ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(`${sourceId} local path must remain inside clinical-sources/.`);
  }
}

async function listSourceFiles(directory: string, repositoryRoot: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(absolutePath, repositoryRoot)));
      continue;
    }

    if (entry.isFile() && sourceFileExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(relative(repositoryRoot, absolutePath).split(sep).join("/"));
    }
  }

  return files.sort();
}
