import * as vscode from "vscode";
import { execFile } from "child_process";
import { promisify } from "util";
import { CliHelper } from "../utils/cliHelper";
import { parseFormatOutput } from "../utils/outputParser";
import { DiagnosticsManager } from "../utils/diagnosticsManager";

const execFileAsync = promisify(execFile);

export async function runFormatCommand(): Promise<void> {
  const options = await vscode.window.showQuickPick(
    [
      "Format Current File",
      "Format Selected Files",
      "Format Entire Workspace",
      "Check Format (Current File)",
      "Check Format (Selected Files)",
      "Check Format (Workspace)"
    ],
    { placeHolder: "Choose a formatting option" }
  );

  if (!options) return;

  switch (options) {
    case "Format Current File":
      await formatCurrentFile();
      break;
    case "Format Selected Files":
      await formatSelectedFiles();
      break;
    case "Format Entire Workspace":
      await formatWorkspace();
      break;
    case "Check Format (Current File)":
      await checkFormatCurrentFile();
      break;
    case "Check Format (Selected Files)":
      await checkFormatSelectedFiles();
      break;
    case "Check Format (Workspace)":
      await checkFormatWorkspace();
      break;
  }
}

async function formatCurrentFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found.");
    return;
  }

  const document = editor.document;
  if (!isJsonFile(document)) {
    vscode.window.showErrorMessage("Current file is not a JSON file.");
    return;
  }

  await formatFiles([document.uri.fsPath], false);
}

async function formatSelectedFiles(): Promise<void> {
  const files = await vscode.window.showOpenDialog({
    canSelectMany: true,
    filters: { 
      "JSON Files": ["json"],
      "JSON Schema Files": ["schema.json", "json"]
    },
    openLabel: "Select JSON files to format",
  });

  if (files && files.length > 0) {
    await formatFiles(files.map(f => f.fsPath), false);
  } else {
    vscode.window.showWarningMessage("No files selected for formatting.");
  }
}

async function formatWorkspace(): Promise<void> {
  const files = await vscode.workspace.findFiles("**/*.json", "**/node_modules/**");
  
  if (files.length === 0) {
    vscode.window.showWarningMessage("No JSON files found in the workspace.");
    return;
  }

  const choice = await vscode.window.showWarningMessage(
    `This will format ${files.length} JSON files in the workspace. Do you want to continue?`,
    "Yes", "No"
  );

  if (choice === "Yes") {
    await formatFiles(files.map(f => f.fsPath), false);
  }
}

async function checkFormatCurrentFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found.");
    return;
  }

  const document = editor.document;
  if (!isJsonFile(document)) {
    vscode.window.showErrorMessage("Current file is not a JSON file.");
    return;
  }

  await formatFiles([document.uri.fsPath], true);
}

async function checkFormatSelectedFiles(): Promise<void> {
  const files = await vscode.window.showOpenDialog({
    canSelectMany: true,
    filters: { 
      "JSON Files": ["json"],
      "JSON Schema Files": ["schema.json", "json"]
    },
    openLabel: "Select JSON files to check formatting",
  });

  if (files && files.length > 0) {
    await formatFiles(files.map(f => f.fsPath), true);
  } else {
    vscode.window.showWarningMessage("No files selected for format checking.");
  }
}

async function checkFormatWorkspace(): Promise<void> {
  const files = await vscode.workspace.findFiles("**/*.json", "**/node_modules/**");
  
  if (files.length === 0) {
    vscode.window.showWarningMessage("No JSON files found in the workspace.");
    return;
  }

  await formatFiles(files.map(f => f.fsPath), true);
}

async function formatFiles(filePaths: string[], checkOnly: boolean): Promise<void> {
  const cli = await CliHelper.getInstance().getCliCommand();

  if (filePaths.length === 0) {
    vscode.window.showWarningMessage("No files provided for formatting.");
    return;
  }

  const args = ["fmt", ...filePaths];
  if (checkOnly) {
    args.push("--check");
  }

  const actionWord = checkOnly ? "Checking" : "Formatting";
  const title = `${actionWord} JSON Schema${filePaths.length > 1 ? 's' : ''}...`;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: title,
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
        
        if (checkOnly) {
          // Parse check output and show diagnostics
          const diagnostics = parseFormatOutput(output);
          
          // Clear previous diagnostics
          DiagnosticsManager.getInstance().clearDiagnostics("format");
          
          // Set diagnostics for each file
          for (const filePath of filePaths) {
            const fileUri = vscode.Uri.file(filePath);
            const fileDiagnostics = diagnostics.filter(d => d.filePath === filePath);
            DiagnosticsManager.getInstance().updateDiagnostics(
              fileUri,
              fileDiagnostics.map(d => d.diagnostic),
              "format"
            );
          }
          
          if (diagnostics.length === 0) {
            vscode.window.showInformationMessage(
              `All ${filePaths.length} file${filePaths.length > 1 ? 's are' : ' is'} properly formatted`
            );
          } else {
            vscode.window.showWarningMessage(
              `Found formatting issues in ${diagnostics.length} file${diagnostics.length > 1 ? 's' : ''}. Check the Problems panel for details.`
            );
          }
        } else {
          // reload documents that were changed
          for (const filePath of filePaths) {
            const document = vscode.workspace.textDocuments.find(
              doc => doc.uri.fsPath === filePath
            );
            if (document) {
              await vscode.commands.executeCommand("workbench.action.files.revert");
            }
          }
          
          vscode.window.showInformationMessage(
            `Successfully formatted ${filePaths.length} file${filePaths.length > 1 ? 's' : ''}`
          );
        }
      } catch (error: any) {
        if (checkOnly && error.code === 1) {
          // parse the output to show what's wrong
          const output = `${error.stdout || ''}\n${error.stderr || ''}`.trim();
          const diagnostics = parseFormatOutput(output);
          
          DiagnosticsManager.getInstance().clearDiagnostics("format");
          
          for (const filePath of filePaths) {
            const fileUri = vscode.Uri.file(filePath);
            const fileDiagnostics = diagnostics.filter(d => d.filePath === filePath);
            DiagnosticsManager.getInstance().updateDiagnostics(
              fileUri,
              fileDiagnostics.map(d => d.diagnostic),
              "format"
            );
          }
          
          vscode.window.showWarningMessage(
            `Found formatting issues in ${diagnostics.length} file${diagnostics.length > 1 ? 's' : ''}. Check the Problems panel for details.`
          );
        } else {
          vscode.window.showErrorMessage(`Formatting failed: ${error.message}`);
        }
      }
      progress.report({ increment: 100 });
    }
  );
}

function isJsonFile(document: vscode.TextDocument): boolean {
  return document.languageId === "json" || 
         document.languageId === "jsonc" ||
         document.fileName.endsWith(".json") ||
         document.fileName.endsWith(".jsonc");
}
