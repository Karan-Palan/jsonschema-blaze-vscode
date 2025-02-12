import * as vscode from "vscode";

export class StatusBarManager {
  private context: vscode.ExtensionContext;
  private statusBarItem: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
  }

  initialize(): void {
    this.statusBarItem.text = "$(json) JSON Schema";
    this.statusBarItem.tooltip = "Click to validate or lint JSON Schema";
    this.statusBarItem.command = "jsonschema.showQuickPicks";
    this.statusBarItem.show();

    this.context.subscriptions.push(this.statusBarItem);
  }

  updateStatus(message: string, type: "success" | "error" | "working"): void {
    switch (type) {
      case "success":
        this.statusBarItem.text = "$(check) JSON Schema - Success";
        this.statusBarItem.tooltip = message;
        break;
      case "error":
        this.statusBarItem.text = "$(error) JSON Schema - Error";
        this.statusBarItem.tooltip = message;
        break;
      case "working":
        this.statusBarItem.text = "$(sync~spin) JSON Schema - Processing...";
        this.statusBarItem.tooltip = message;
        break;
    }
  }

  updateLintStatus(message: string, type: "success" | "error" | "working"): void {
    switch (type) {
      case "success":
        this.statusBarItem.text = "$(check) JSON Lint - No Issues";
        this.statusBarItem.tooltip = message;
        break;
      case "error":
        this.statusBarItem.text = "$(alert) JSON Lint - Issues Found";
        this.statusBarItem.tooltip = message;
        break;
      case "working":
        this.statusBarItem.text = "$(sync~spin) JSON Lint - Running...";
        this.statusBarItem.tooltip = message;
        break;
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
