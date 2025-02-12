import * as vscode from "vscode";
import { execFile } from "child_process";
import { promisify } from "util";
import { CliHelper } from "../utils/cliHelper";
import { parseLintOutput } from "../utils/outputParser";
import { DiagnosticsManager } from "../utils/diagnosticsManager";

const execFileAsync = promisify(execFile);

export async function runLintCommand(): Promise<void> {
  const options = await vscode.window.showQuickPick(
    [
      "Lint Selected File",
      "Lint Multiple Files",
      "Lint Entire Workspace",
      "Lint Entire Workspace (Ignoring Certain Paths)",
      "Lint by Extension",
      "Fix Lint Issues"
    ],
    { placeHolder: "Choose a linting option" }
  );

  if (!options) return;

  switch (options) {
    case "Lint Selected File":
      await lintSingleFile();
      break;
    case "Lint Multiple Files":
      await lintMultipleFiles();
      break;
    case "Lint Entire Workspace":
      await lintWorkspace();
      break;
    case "Lint Entire Workspace (Ignoring Certain Paths)":
      await lintWorkspaceWithIgnore();
      break;
    case "Lint by Extension":
      await lintByExtension();
      break;
    case "Fix Lint Issues":
      await fixLintIssues();
      break;
  }
}

async function lintSingleFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found.");
    return;
  }
  await runLint([editor.document.uri.fsPath]);
}

async function lintMultipleFiles(): Promise<void> {
  const files = await vscode.window.showOpenDialog({
    canSelectMany: true,
    filters: { JSON: ["json"] },
    openLabel: "Select Schema File(s) for Linting",
  });

  if (!files || files.length === 0) {
    vscode.window.showErrorMessage("No files selected.");
    return;
  }

  await runLint(files.map(f => f.fsPath));
}

async function lintWorkspace(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace opened.");
    return;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;
  await runLint([workspacePath]);
}

async function lintWorkspaceWithIgnore(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace opened.");
    return;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;

  const ignorePaths = await vscode.window.showInputBox({
    placeHolder: "Enter paths to ignore (comma-separated)",
    prompt: "Example: path/to/ignore1, path/to/ignore2",
  });

  const args = [workspacePath];
  if (ignorePaths) {
    ignorePaths.split(",").forEach(path => args.push("--ignore", path.trim()));
  }

  await runLint(args);
}

async function lintByExtension(): Promise<void> {
  const extension = await vscode.window.showInputBox({
    placeHolder: "Enter file extension (e.g., .schema.json)",
    prompt: "Specify which file types to lint",
  });

  if (!extension) {
    vscode.window.showErrorMessage("No extension provided.");
    return;
  }

  await runLint(["--extension", extension]);
}

async function fixLintIssues(): Promise<void> {
  const files = await vscode.window.showOpenDialog({
    canSelectMany: true,
    filters: { JSON: ["json"] },
    openLabel: "Select Schema File(s) to Auto-Fix",
  });

  if (!files || files.length === 0) {
    vscode.window.showErrorMessage("No files selected.");
    return;
  }

  const filePaths = files.map(f => f.fsPath);
  await runLint([...filePaths, "--fix"]);
}

async function runLint(args: string[]): Promise<void> {
  const cli = await CliHelper.getInstance().getCliCommand();
  const fullArgs = ["lint", ...args];

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
          ...fullArgs,
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
