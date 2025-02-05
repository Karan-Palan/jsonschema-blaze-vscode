# JSON Schema Validator Blaze

A high-performance JSON Schema validator and linter for Visual Studio Code, powered by [sourcemeta/jsonschema](https://github.com/sourcemeta/jsonschema) (a cli that uses [sourcemeta/blaze](https://github.com/sourcemeta/blaze)).

## Features

- **Validation:** Quickly validate JSON files against JSON Schemas.
- **Linting:** Identify and highlight errors or warnings in your JSON files.

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

### Testing

```bash
npm test
```

## Contributing

Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request.

**Author:** Karan Palan

Powered by [sourcemeta/jsonschema](https://github.com/sourcemeta/jsonschema) and [sourcemeta/blaze](https://github.com/sourcemeta/blaze).
