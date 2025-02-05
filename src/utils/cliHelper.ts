import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";

const exists = promisify(fs.exists);

interface CliConfig {
  command: string;
  args: string[];
}

export class CliHelper {
  private static instance: CliHelper;
  private extensionContext: vscode.ExtensionContext;

  private constructor(context: vscode.ExtensionContext) {
    this.extensionContext = context;
  }

  static initialize(context: vscode.ExtensionContext): void {
    CliHelper.instance = new CliHelper(context);
  }

  static getInstance(): CliHelper {
    if (!CliHelper.instance) {
      throw new Error("CliHelper not initialized. Call initialize() first.");
    }
    return CliHelper.instance;
  }

  async getCliCommand(): Promise<CliConfig> {
    try {
      // First, check user configuration
      const cliPath = await this.getConfiguredCliPath();
      if (cliPath) {
        return { command: cliPath, args: [] };
      }

      // Then, try to find in extension's node_modules
      const extensionCliPath = await this.findInExtensionNodeModules();
      if (extensionCliPath) {
        return { command: extensionCliPath, args: [] };
      }

      // Finally, check workspace node_modules
      const workspaceCliPath = await this.findInWorkspaceNodeModules();
      if (workspaceCliPath) {
        return { command: workspaceCliPath, args: [] };
      }

      // If CLI is not found, show detailed error message and installation instructions
      await this.showInstallationInstructions();
      throw new Error("JSON Schema CLI not found");
    } catch (error) {
      throw new Error(`Failed to locate JSON Schema CLI: ${error.message}`);
    }
  }

  private async getConfiguredCliPath(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration("jsonSchemaExtension");
    const configuredPath = config.get<string>("cliPath");
    
    if (configuredPath && await exists(configuredPath)) {
      return configuredPath;
    }
    return null;
  }

  private async findInExtensionNodeModules(): Promise<string | null> {
    const extensionPath = this.extensionContext.extensionPath;
    const possiblePaths = [
      path.join(extensionPath, "node_modules", ".bin", "jsonschema"),
      path.join(extensionPath, "node_modules", ".bin", "jsonschema.cmd"),
      path.join(extensionPath, "node_modules", "@sourcemeta", "jsonschema", "bin", "jsonschema")
    ];

    for (const binPath of possiblePaths) {
      if (await exists(binPath)) {
        return binPath;
      }
    }
    return null;
  }

  private async findInWorkspaceNodeModules(): Promise<string | null> {
    if (!vscode.workspace.workspaceFolders) {
      return null;
    }

    for (const folder of vscode.workspace.workspaceFolders) {
      const possiblePaths = [
        path.join(folder.uri.fsPath, "node_modules", ".bin", "jsonschema"),
        path.join(folder.uri.fsPath, "node_modules", ".bin", "jsonschema.cmd"),
        path.join(folder.uri.fsPath, "node_modules", "@sourcemeta", "jsonschema", "bin", "jsonschema")
      ];

      for (const binPath of possiblePaths) {
        if (await exists(binPath)) {
          return binPath;
        }
      }
    }
    return null;
  }

  private async showInstallationInstructions(): Promise<void> {
    const message = "JSON Schema CLI not found. Would you like to see installation instructions?";
    const response = await vscode.window.showErrorMessage(message, "Yes", "No");
    
    if (response === "Yes") {
      const panel = vscode.window.createWebviewPanel(
        "jsonSchemaInstall",
        "JSON Schema CLI Installation",
        vscode.ViewColumn.One,
        {}
      );

      panel.webview.html = `
        <html>
          <body>
            <h2>JSON Schema CLI Installation Instructions</h2>
            <p>To use this extension, you need to install the JSON Schema CLI. You have several options:</p>
            <h3>1. Install globally (recommended)</h3>
            <pre>npm install -g @sourcemeta/jsonschema</pre>
            <h3>2. Install in your project</h3>
            <pre>npm install --save-dev @sourcemeta/jsonschema</pre>
            <h3>3. Configure custom CLI path</h3>
            <p>If you have the CLI installed in a custom location, you can configure it in VS Code settings:</p>
            <ol>
              <li>Open VS Code settings (File > Preferences > Settings)</li>
              <li>Search for "JSON Schema Extension"</li>
              <li>Set the "CLI Path" setting to your custom path</li>
            </ol>
            <p>After installation, reload VS Code to activate the extension.</p>
          </body>
        </html>
      `;
    }
  }
}

