import * as vscode from "vscode";
import { CliHelper } from "./utils/cliHelper";
import { CommandManager } from "./commands/commandManager";
import { StatusBarManager } from "./status/statusBarManager";

export function activate(context: vscode.ExtensionContext) {
  // Initialize the CLI Helper
  CliHelper.initialize(context);

  // Initialize command manager
  const commandManager = new CommandManager(context);
  commandManager.registerCommands();

  // Initialize status bar
  const statusBar = new StatusBarManager(context);
  statusBar.initialize();

  // Setup auto-validation if enabled
  // setupAutoValidation(context);

  console.log("JSON Schema Validator Blaze is now active");
}

// function setupAutoValidation(context: vscode.ExtensionContext) {
//   const config = vscode.workspace.getConfiguration("jsonSchemaExtension");
//   if (config.get<boolean>("autoValidate")) {
//     const disposable = vscode.workspace.onDidSaveTextDocument(
//       async (document) => {
//         if (document.languageId === "json" || document.languageId === "jsonc") {
//           await vscode.commands.executeCommand("jsonschema.validate");
//         }
//       }
//     );
//     context.subscriptions.push(disposable);
//   }
// }

export function deactivate() {}
