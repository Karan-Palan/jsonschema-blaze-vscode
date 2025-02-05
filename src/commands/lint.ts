import * as vscode from "vscode";
import { execFile } from "child_process";
import { promisify } from "util";
import { CliHelper } from "../utils/cliHelper";
import { parseLintOutput } from "../utils/outputParser";
import { DiagnosticsManager } from "../utils/diagnosticsManager";

const execFileAsync = promisify(execFile);

export async function runLintCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    throw new Error("No active editor found");
  }

  const filePath = editor.document.uri.fsPath;
  await runLint(filePath);
}

async function runLint(filePath: string): Promise<void> {
  const cli = await CliHelper.getInstance().getCliCommand();
  const args = ["lint", filePath];

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Linting JSON Schema...",
      cancellable: false,
    },
    async () => {
      try {
        const { stdout, stderr } = await execFileAsync(cli.command, [
          ...cli.args,
          ...args,
        ]);
        const output = `${stdout}\n${stderr}`.trim();

        console.log("Lint Output:", output);

        // Parse lint output
        const diagnostics = parseLintOutput(output);

        console.log("Diagnostics Generated:", diagnostics);

        // Update VS Code Problems tab
        DiagnosticsManager.getInstance().updateDiagnostics(
          vscode.window.activeTextEditor?.document.uri,
          diagnostics,
          "lint"
        );

        // Show results based on diagnostics
        if (diagnostics.length > 0) {
          vscode.window.showWarningMessage(
            `Linting completed with ${diagnostics.length} issues.`
          );
        } else {
          vscode.window.showInformationMessage("Linting passed successfully.");
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Linting failed: ${error.message}`);
        console.error("Linting Error:", error);
      }
    }
  );
}
