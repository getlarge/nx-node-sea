# @getlarge/nx-node-sea

A plugin for [Nx](https://nx.dev) that provides integration with [Node.js Single Executable Applications (SEA)](https://nodejs.org/api/single-executable-applications.html).

## Overview

This plugin helps you create Node.js Single Executable Applications (SEA) within your Nx workspace. It automates the process of generating SEA preparation blobs and creating standalone executables that bundle your Node.js application.

## Requirements

- Node.js 20 or higher (SEA feature requirement)
- Nx 20.0.6 or higher

## Installation

```bash
npm install --save-dev @getlarge/nx-node-sea
```

## Usage

### 1. Create a sea-config.json file

Create a `sea-config.json` file in your project's root directory:

```json
{
  "main": "dist/your-app/main.js",
  "output": "dist/your-app/main.blob",
  "disableExperimentalSEAWarning": false,
  "useSnapshot": false,
  "useCodeCache": false
}
```

### 2. Configure the plugin in nx.json

Add the plugin configuration to your `nx.json` file:

```json
{
  "plugins": [
    {
      "plugin": "@getlarge/nx-node-sea",
      "options": {
        "seaTargetName": "sea-build",
        "buildTarget": "build"
      }
    }
  ]
}
```

> **Note:** The `buildTarget` option specifies the target that will be used to build your application before creating the SEA. The default value is `"build"`.

### 3. Build your SEA

```bash
nx run your-app:sea-build
```

This will:

1. Build your application using the specified build target
2. Generate a SEA preparation blob
3. Create a standalone executable

## Configuration Options

### Plugin Options

| Option          | Description                                                  | Default       |
| --------------- | ------------------------------------------------------------ | ------------- |
| `buildTarget`   | The target to build your application before creating the SEA | `"build"`     |
| `seaTargetName` | The name of the target that will be created to build the SEA | `"sea-build"` |

### SEA Config Options

| Option                          | Description                                          | Required |
| ------------------------------- | ---------------------------------------------------- | -------- |
| `main`                          | Path to the main JavaScript file of your application | Yes      |
| `output`                        | Path where the SEA blob will be generated            | Yes      |
| `disableExperimentalSEAWarning` | Disable warnings about experimental feature          | No       |
| `useSnapshot`                   | Use V8 snapshot for faster startup                   | No       |
| `useCodeCache`                  | Use code cache for faster startup                    | No       |
| `assets`                        | Record of assets to include in the blob              | No       |

## Platform Support

The plugin automatically handles platform-specific differences for:

- Linux
- macOS (includes code signing)
- Windows

## Learn More

- [Node.js Single Executable Applications](https://nodejs.org/api/single-executable-applications.html)
- [Nx Build System](https://nx.dev/features/build)
- [Postject](https://github.com/nodejs/postject) - Used for injecting the blob into the executable

## Example Project Structure

```
my-app/
├── sea-config.json
├── project.json
└── src/
    └── main.ts
```

The plugin will create a standalone executable in the directory specified in `sea-config.json` (`output`).

On macOS and Linux, the binary will be named `node`. On Windows, it will be named `node.exe`.

You can find a complete working example in the [node-sea-demo repository](https://github.com/getlarge/node-sea-demo).
