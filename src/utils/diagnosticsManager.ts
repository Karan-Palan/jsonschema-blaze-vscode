import * as vscode from "vscode";

export class DiagnosticsManager {
  private static instance: DiagnosticsManager;
  private validationDiagnostics: vscode.DiagnosticCollection;
  private lintDiagnostics: vscode.DiagnosticCollection;
  private formatDiagnostics: vscode.DiagnosticCollection;

  private constructor() {
    this.validationDiagnostics = vscode.languages.createDiagnosticCollection(
      "jsonschema-validation"
    );
    this.lintDiagnostics =
      vscode.languages.createDiagnosticCollection("jsonschema-lint");
    this.formatDiagnostics =
      vscode.languages.createDiagnosticCollection("jsonschema-format");
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
    type: "validation" | "lint" | "format"
  ): void {
    if (!uri) return;

    let collection: vscode.DiagnosticCollection;
    switch (type) {
      case "validation":
        collection = this.validationDiagnostics;
        break;
      case "lint":
        collection = this.lintDiagnostics;
        break;
      case "format":
        collection = this.formatDiagnostics;
        break;
    }

    // Clear previous diagnostics before updating
    collection.delete(uri);
    collection.set(uri, diagnostics);

    console.log(`Updated ${type} diagnostics for ${uri.fsPath}:`, diagnostics);
  }

  clearDiagnostics(type?: "validation" | "lint" | "format"): void {
    if (type) {
      switch (type) {
        case "validation":
          this.validationDiagnostics.clear();
          break;
        case "lint":
          this.lintDiagnostics.clear();
          break;
        case "format":
          this.formatDiagnostics.clear();
          break;
      }
    } else {
      this.validationDiagnostics.clear();
      this.lintDiagnostics.clear();
      this.formatDiagnostics.clear();
    }
  }

  dispose(): void {
    this.validationDiagnostics.dispose();
    this.lintDiagnostics.dispose();
    this.formatDiagnostics.dispose();
  }
}
