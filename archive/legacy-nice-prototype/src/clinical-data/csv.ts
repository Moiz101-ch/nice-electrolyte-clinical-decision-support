export type CsvRecord = Record<string, string>;

/**
 * Parses RFC 4180-style comma-separated values, including quoted values and escaped quotes.
 * The supplied configuration is small, but keeping parsing strict avoids silently shifting fields.
 */
export function parseCsvRecords(content: string): CsvRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotedField = false;

  const appendField = () => {
    row.push(field);
    field = "";
  };

  const appendRow = () => {
    appendField();

    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }

    row = [];
  };

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (character === undefined) {
      continue;
    }

    if (inQuotedField) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotedField = false;
        }
      } else {
        field += character;
      }

      continue;
    }

    if (character === '"') {
      if (field.length > 0) {
        throw new Error("CSV contains an unexpected quote in an unquoted field.");
      }

      inQuotedField = true;
      continue;
    }

    if (character === ",") {
      appendField();
      continue;
    }

    if (character === "\n") {
      appendRow();
      continue;
    }

    if (character === "\r") {
      if (content[index + 1] === "\n") {
        index += 1;
      }

      appendRow();
      continue;
    }

    field += character;
  }

  if (inQuotedField) {
    throw new Error("CSV contains an unterminated quoted field.");
  }

  if (field.length > 0 || row.length > 0) {
    appendRow();
  }

  const [headers, ...dataRows] = rows;

  if (headers === undefined || headers.length === 0) {
    throw new Error("CSV must contain a header row.");
  }

  if (headers.some((header) => header.trim().length === 0)) {
    throw new Error("CSV headers must not be blank.");
  }

  if (new Set(headers).size !== headers.length) {
    throw new Error("CSV headers must be unique.");
  }

  return dataRows.map((dataRow, index) => {
    if (dataRow.length !== headers.length) {
      throw new Error(
        `CSV row ${index + 2} has ${dataRow.length} fields; expected ${headers.length}.`,
      );
    }

    return Object.fromEntries(headers.map((header, column) => [header, dataRow[column] ?? ""]));
  });
}
