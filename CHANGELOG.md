## 0.2.0 (2025-03-10)

### 🚀 Features

- refactor getSeaTargetConfiguration to improve command handling for different platforms ([a295d8f](https://github.com/getlarge/nx-node-sea/commit/a295d8f))
- update CI workflow to support Node.js 22 and add Windows to the OS matrix ([b7f7336](https://github.com/getlarge/nx-node-sea/commit/b7f7336))
- add mock build output generation in test project setup ([c439bf0](https://github.com/getlarge/nx-node-sea/commit/c439bf0))

### 🩹 Fixes

- add condition to bypass cache operations when NX_CACHE_PROJECT_GRAPH is false ([bdd69f3](https://github.com/getlarge/nx-node-sea/commit/bdd69f3))
- update package name references to @getlarge/nx-node-sea in tests and configuration ([f4b65ef](https://github.com/getlarge/nx-node-sea/commit/f4b65ef))
- update CI cache key and correct command syntax in plugin ([2016c2f](https://github.com/getlarge/nx-node-sea/commit/2016c2f))
- enable shell option in child process for improved command execution ([8d9a01b](https://github.com/getlarge/nx-node-sea/commit/8d9a01b))
- increase timeout values and add verbose flag for SEA build tests ([298e96f](https://github.com/getlarge/nx-node-sea/commit/298e96f))
- update Windows command handling in getSeaCommands function ([2715bce](https://github.com/getlarge/nx-node-sea/commit/2715bce))
- conditionally include sign commands in getSeaCommands function ([090965c](https://github.com/getlarge/nx-node-sea/commit/090965c))
- update path handling for Windows in getSeaCommands function ([85b5948](https://github.com/getlarge/nx-node-sea/commit/85b5948))
- increase timeout values for SEA build tests ([db5a61d](https://github.com/getlarge/nx-node-sea/commit/db5a61d))
- refactor build output directory handling and update command paths in getSeaCommands function ([1a8c70d](https://github.com/getlarge/nx-node-sea/commit/1a8c70d))
- update SEA command handling to use 'main.exe' instead of 'node.exe' ([ec96ec5](https://github.com/getlarge/nx-node-sea/commit/ec96ec5))
- remove unnecessary cache key from CI workflow ([32de7b8](https://github.com/getlarge/nx-node-sea/commit/32de7b8))
- update Windows postject params ([77fc69b](https://github.com/getlarge/nx-node-sea/commit/77fc69b))
- update file existence check to use stringContaining matcher ([8096a62](https://github.com/getlarge/nx-node-sea/commit/8096a62))
- update file existence check to handle platform-specific executable names ([b7898d5](https://github.com/getlarge/nx-node-sea/commit/b7898d5))

### ❤️ Thank You

- getlarge

## 0.1.0 (2024-11-13)

### 🚀 Features

- initial plugin implementation ([a9c3e92](https://github.com/getlarge/nx-node-sea/commit/a9c3e92))
- init e2e tests ([4484554](https://github.com/getlarge/nx-node-sea/commit/4484554))
- update ESLint config and add postject dependency ([1d7024b](https://github.com/getlarge/nx-node-sea/commit/1d7024b))
- enhance test output assertion in nx-node-sea spec ([36a9f55](https://github.com/getlarge/nx-node-sea/commit/36a9f55))
- update CI workflow to include e2e tests ([154b410](https://github.com/getlarge/nx-node-sea/commit/154b410))
- enhance release configuration with changelog and git options ([08e1d70](https://github.com/getlarge/nx-node-sea/commit/08e1d70))

### 🩹 Fixes

- make plugin platform aware ([1fa8ce5](https://github.com/getlarge/nx-node-sea/commit/1fa8ce5))

### ❤️ Thank You

- getlarge
