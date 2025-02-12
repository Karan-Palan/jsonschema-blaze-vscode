import * as vscode from "vscode";

interface ParsedLocation {
  line: number;
  column: number;
  path: string;
}

export function parseValidateOutput(output: string): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const lines = output.split(/\r?\n/);
  let currentError: { message: string; location?: ParsedLocation } | null = null;

  for (const line of lines) {
    if (line.startsWith("fail:")) {
      if (currentError) {
        diagnostics.push(
          createDiagnostic(currentError, vscode.DiagnosticSeverity.Error)
        );
      }
      currentError = { message: "" };
      continue;
    }

    if (line.startsWith("error:")) {
      if (currentError) {
        currentError.message = line.substring(6).trim();
      }
      continue;
    }

    if (line.includes("at instance location")) {
      if (currentError) {
        currentError.location = parseLocation(line);
      }
      continue;
    }

    if (currentError && currentError.message && line.trim()) {
      currentError.message += " " + line.trim();
    }
  }

  if (currentError) {
    diagnostics.push(
      createDiagnostic(currentError, vscode.DiagnosticSeverity.Error)
    );
  }

  console.log("Parsed Validation Diagnostics:", diagnostics);
  return diagnostics;
}

export function parseLintOutput(output: string): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const lines = output.split(/\r?\n/);
  let currentWarning: { message: string; location?: ParsedLocation } | null = null;

  for (const line of lines) {
    const fileMatch = line.match(/^(.*\.(json|yaml|yml|jsonl))/);
    if (fileMatch) {
      if (currentWarning) {
        diagnostics.push(
          createDiagnostic(currentWarning, vscode.DiagnosticSeverity.Warning)
        );
      }
      currentWarning = { message: "", location: undefined };
      continue;
    }

    const locationMatch = line.match(/line (\d+), col (\d+)/);
    if (locationMatch) {
      if (currentWarning) {
        currentWarning.location = {
          line: parseInt(locationMatch[1]) - 1,
          column: parseInt(locationMatch[2]) - 1,
          path: "",
        };
      }
      continue;
    }

    if (currentWarning && line.trim()) {
      currentWarning.message += (currentWarning.message ? " " : "") + line.trim();
    }
  }

  if (currentWarning) {
    diagnostics.push(
      createDiagnostic(currentWarning, vscode.DiagnosticSeverity.Warning)
    );
  }

  console.log("Parsed Lint Diagnostics:", diagnostics);
  return diagnostics;
}

function parseLocation(line: string): ParsedLocation {
  const locationMatch = line.match(/line (\d+), col (\d+)/);
  return {
    line: locationMatch ? parseInt(locationMatch[1]) - 1 : 0,
    column: locationMatch ? parseInt(locationMatch[2]) - 1 : 0,
    path: line.match(/at instance location "(.*?)"/)?.[1] || "",
  };
}

function createDiagnostic(
  error: { message: string; location?: ParsedLocation },
  severity: vscode.DiagnosticSeverity
): vscode.Diagnostic {
  const range = error.location
    ? new vscode.Range(
        error.location.line,
        error.location.column,
        error.location.line,
        error.location.column + 1
      )
    : new vscode.Range(0, 0, 0, 1);

  const diagnostic = new vscode.Diagnostic(range, error.message, severity);
  diagnostic.source = "JSON Schema Validator Blaze";
  return diagnostic;
}
