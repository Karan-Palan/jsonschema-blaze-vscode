import * as vscode from "vscode";
import { runValidationCommand } from "./validate";
import { runLintCommand } from "./lint";

export class CommandManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  registerCommands(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand("jsonschema.validate", async () => {
        try {
          await runValidationCommand();
        } catch (error) {
          this.handleError("Validation", error);
        }
      }),

      vscode.commands.registerCommand("jsonschema.lint", async () => {
        try {
          await runLintCommand();
        } catch (error) {
          this.handleError("Linting", error);
        }
      }),

      vscode.commands.registerCommand("jsonschema.showQuickPicks", async () => {
        const choice = await vscode.window.showQuickPick(
          [
            {
              label: "$(checklist) Validate Schema",
              command: "jsonschema.validate",
            },
            { label: "$(telescope) Lint Schema", command: "jsonschema.lint" },
          ],
          { placeHolder: "Select JSON Schema action" }
        );

        if (choice) {
          await vscode.commands.executeCommand(choice.command);
        }
      })
    );
  }

  private handleError(operation: string, error: Error): void {
    const errorMessage = `${operation} failed: ${error.message}`;
    vscode.window.showErrorMessage(errorMessage);
    console.error(errorMessage);
  }
}
