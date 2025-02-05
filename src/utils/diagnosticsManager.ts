import * as vscode from "vscode";

export class DiagnosticsManager {
  private static instance: DiagnosticsManager;
  private validationDiagnostics: vscode.DiagnosticCollection;
  private lintDiagnostics: vscode.DiagnosticCollection;

  private constructor() {
    this.validationDiagnostics = vscode.languages.createDiagnosticCollection(
      "jsonschema-validation"
    );
    this.lintDiagnostics =
      vscode.languages.createDiagnosticCollection("jsonschema-lint");
  }

  static getInstance(): DiagnosticsManager {
    if (!DiagnosticsManager.instance) {
      DiagnosticsManager.instance = new DiagnosticsManager();
    }
    return DiagnosticsManager.instance;
  }

  updateDiagnostics(
    uri: vscode.Uri | undefined,
    diagnostics: vscode.Diagnostic[],
    type: "validation" | "lint"
  ): void {
    if (!uri) return;

    const collection =
      type === "validation" ? this.validationDiagnostics : this.lintDiagnostics;

    // Clear previous diagnostics before updating
    collection.delete(uri);
    collection.set(uri, diagnostics);

    console.log(`Updated ${type} diagnostics for ${uri.fsPath}:`, diagnostics);
  }

  clearDiagnostics(): void {
    this.validationDiagnostics.clear();
    this.lintDiagnostics.clear();
  }

  dispose(): void {
    this.validationDiagnostics.dispose();
    this.lintDiagnostics.dispose();
  }
}
