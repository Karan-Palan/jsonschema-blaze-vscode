import * as vscode from "vscode";
import { execFile } from "child_process";
import { promisify } from "util";
import { CliHelper } from "../utils/cliHelper";
import { parseValidateOutput } from "../utils/outputParser";
import { DiagnosticsManager } from "../utils/diagnosticsManager";

const execFileAsync = promisify(execFile);

export async function runValidationCommand(): Promise<void> {
  const selection = await vscode.window.showQuickPick(
    ["Select Schema and Instance", "Validate Entire Workspace"],
    { placeHolder: "Choose what you want to validate" }
  );

  if (selection === "Select Schema and Instance") {
    const schemaFile = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { JSON: ["json"] },
      openLabel: "Select Schema File",
    });

    if (schemaFile && schemaFile[0]) {
      const instanceFiles = await vscode.window.showOpenDialog({
        canSelectMany: true,
        filters: { JSON: ["json"] },
        openLabel: "Select Instance File(s)",
      });

      if (instanceFiles && instanceFiles.length > 0) {
        await runValidation(
          schemaFile[0].fsPath,
          instanceFiles.map((f) => f.fsPath)
        );
      } else {
        vscode.window.showWarningMessage(
          "No instance files selected for validation."
        );
      }
    } else {
      vscode.window.showWarningMessage(
        "No schema file selected for validation."
      );
    }
  } else if (selection === "Validate Entire Workspace") {
    const files = await vscode.workspace.findFiles("**/*.json");
    const schemaFiles = files.filter((file) =>
      file.path.toLowerCase().includes("schema")
    );
    const instanceFiles = files.filter(
      (file) => !file.path.toLowerCase().includes("schema")
    );

    if (schemaFiles.length === 0) {
      vscode.window.showWarningMessage(
        "No schema files found in the workspace."
      );
      return;
    }

    if (instanceFiles.length === 0) {
      vscode.window.showWarningMessage(
        "No instance files found in the workspace."
      );
      return;
    }

    for (const schema of schemaFiles) {
      await runValidation(
        schema.fsPath,
        instanceFiles.map((f) => f.fsPath)
      );
    }
  }
}

async function runValidation(
  schemaPath: string,
  instancePaths: string[]
): Promise<void> {
  const cli = await CliHelper.getInstance().getCliCommand();

  if (!schemaPath || instancePaths.length === 0) {
    vscode.window.showWarningMessage(
      `Both schema and instance files are required for validation.`
    );
    return;
  }

  const args = ["validate", schemaPath, ...instancePaths];

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Validating JSON Schema...",
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0 });
      try {
        const { stdout, stderr } = await execFileAsync(cli.command, [
          ...cli.args,
          ...args,
        ]);
        const output = `${stdout}\n${stderr}`.trim();
        const diagnostics = parseValidateOutput(output);

        DiagnosticsManager.getInstance().updateDiagnostics(
          vscode.window.activeTextEditor?.document.uri,
          diagnostics,
          "validation"
        );

        if (diagnostics.length === 0) {
          vscode.window.showInformationMessage(
            "Validation passed successfully"
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Validation failed: ${error.message}`);
      }
      progress.report({ increment: 100 });
    }
  );
}
