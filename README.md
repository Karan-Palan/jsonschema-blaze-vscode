# JSON Schema Validator Blaze

A high-performance JSON Schema validator and linter for Visual Studio Code, powered by [sourcemeta/jsonschema](https://github.com/sourcemeta/jsonschema) (a cli that uses [sourcemeta/blaze](https://github.com/sourcemeta/blaze)).

## Features

- **Validation:** Quickly validate JSON files against JSON Schemas.
- **Linting:** Identify and highlight errors or warnings in your JSON files.
- **Formatting:** Format JSON Schema files according to industry-standard conventions.

## Installation

1. Open VS Code.
2. Go to the Extensions view (`Ctrl+Shift+X`).
3. Search for "JSON Schema Validator Blaze."
4. Click **Install**.

## Usage

### Commands

- **Validate JSON Schema**

  - Command: `JSON Schema: Validate`
  - Shortcut: `Ctrl+Alt+V` (Windows/Linux) / `Cmd+Alt+V` (Mac)

- **Lint JSON Schema**

  - Command: `JSON Schema: Lint`
  - Shortcut: `Ctrl+Alt+L` (Windows/Linux) / `Cmd+Alt+L` (Mac)

- **Format JSON Schema**
  - Command: `JSON Schema: Format`
  - Shortcut: `Ctrl+Alt+F` (Windows/Linux) / `Cmd+Alt+F` (Mac)

### Auto Validation

JSON files are automatically validated on save. This can be toggled in the settings.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [VS Code Extension Host](https://code.visualstudio.com/api)

### Build and Run

```bash
npm install
npm run compile
```

Press `F5` to launch the extension in a new VS Code window.

## Summary

I have successfully analyzed and enhanced the JSON Schema Validator Blaze VS Code extension with the following improvements:

### 🔍 **Codebase Analysis**
- **Extension Structure**: The extension follows a well-organized modular structure with separate command handlers, utilities, and diagnostics management
- **Architecture**: Uses the Command Pattern with a `CommandManager` that registers VS Code commands, and utility classes for CLI interaction and output parsing
- **Existing Commands**: 
  - `validate`: Validates JSON files against schemas using `jsonschema validate`
  - `lint`: Lints JSON schema files using `jsonschema lint`

### ⬆️ **CLI Version Update** 
- Updated `@sourcemeta/jsonschema` to the latest version (11.5.1)
- The extension now uses the most recent features and improvements from the CLI

### ✨ **New Format Feature Implementation**
I implemented the `jsonschema fmt` command integration with the following features:

#### **Command Options:**
- **Format Current File**: Formats the currently active JSON schema file
- **Format Selected Files**: Opens file picker to format multiple selected files
- **Format Entire Workspace**: Formats all JSON files in the workspace (with confirmation)
- **Check Format (Current File)**: Checks formatting without making changes
- **Check Format (Selected Files)**: Checks formatting for selected files
- **Check Format (Workspace)**: Checks formatting across the workspace

#### **Key Features:**
- **In-place formatting**: Automatically formats files according to JSON Schema conventions
- **Format checking**: Validates formatting without making changes
- **Diagnostics integration**: Shows formatting issues in VS Code's Problems panel
- **Progress indication**: Shows progress during formatting operations
- **Error handling**: Graceful error handling with user-friendly messages

### 🎯 **How to Test the Format Command**

#### **Method 1: Using VS Code Extension (Recommended)**
1. **Create a test schema with poor formatting:**
   ```json
   { "$schema":"https://json-schema.org/draft/2020-12/schema",
       "type":"object","properties":{"name":{"type":"string"},"age":{"type":"number","minimum":0}},
   "$id":"https://example.com/person.json",
       "title":"Person Schema","required":["name"]}
   ```

2. **Test the format command:**
   - Open the file in VS Code
   - Press `Ctrl+Alt+F` (Windows/Linux) or `Cmd+Alt+F` (Mac)
   - Choose "Check Format (Current File)" to see formatting issues in Problems panel
   - Choose "Format Current File" to fix the formatting

3. **Expected formatted output:**
   ```json
   {
     "$schema": "https://json-schema.org/draft/2020-12/schema",
     "$id": "https://example.com/person.json",
     "title": "Person Schema", 
     "type": "object",
     "required": [ "name" ],
     "properties": {
       "age": {
         "type": "number",
         "minimum": 0
       },
       "name": {
         "type": "string"
       }
     }
   }
   ```

#### **Method 2: Command Line Testing**
```bash
# Test format check (shows what needs to be fixed)
jsonschema fmt test-schema.json --check

# Format in place  
jsonschema fmt test-schema.json

# Format with options
jsonschema fmt --extension .schema.json  # Format only .schema.json files
jsonschema fmt --keep-ordering          # Preserve keyword ordering
```

#### **Method 3: Extension Development Testing**
```bash
# Run the extension in development mode
npm install
npm run compile
# Press F5 in VS Code to launch extension host

# Run tests
npm test  # Note: May have some ESLint warnings but core functionality works
```

### 🛠 **Technical Implementation Details**

1. **New Files Created:**
   - `src/commands/format.ts`: Main format command implementation
   - `src/test/format.test.ts`: Unit tests for format output parsing

2. **Modified Files:**
   - `src/commands/commandManager.ts`: Added format command registration
   - `src/utils/outputParser.ts`: Added `parseFormatOutput` function
   - `src/utils/diagnosticsManager.ts`: Added format diagnostics support
   - `package.json`: Added format command and keybinding (`Ctrl+Alt+F`)

3. **Features:**
   - Integrates with VS Code's diagnostics system
   - Supports both formatting and format checking
   - Works with single files, multiple files, or entire workspace
   - Provides clear user feedback and error handling

The format feature is now fully integrated and ready for use! 🎉

## Contributing

Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request.

**Author:** Karan Palan

Powered by [sourcemeta/jsonschema](https://github.com/sourcemeta/jsonschema) and [sourcemeta/blaze](https://github.com/sourcemeta/blaze).
