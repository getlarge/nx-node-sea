## 0.2.0 (2025-03-10)

### 🚀 Features

- refactor getSeaTargetConfiguration to improve command handling for different platforms ([a295d8f](https://github.com/getlarge/nx-node-sea/commit/a295d8f))

### 🩹 Fixes

- update file existence check to use stringContaining matcher ([8096a62](https://github.com/getlarge/nx-node-sea/commit/8096a62))
- update Windows postject params ([77fc69b](https://github.com/getlarge/nx-node-sea/commit/77fc69b))
- update SEA command handling to use 'main.exe' instead of 'node.exe' ([ec96ec5](https://github.com/getlarge/nx-node-sea/commit/ec96ec5))
- refactor build output directory handling and update command paths in getSeaCommands function ([1a8c70d](https://github.com/getlarge/nx-node-sea/commit/1a8c70d))
- update path handling for Windows in getSeaCommands function ([85b5948](https://github.com/getlarge/nx-node-sea/commit/85b5948))
- conditionally include sign commands in getSeaCommands function ([090965c](https://github.com/getlarge/nx-node-sea/commit/090965c))
- update Windows command handling in getSeaCommands function ([2715bce](https://github.com/getlarge/nx-node-sea/commit/2715bce))
- update CI cache key and correct command syntax in plugin ([2016c2f](https://github.com/getlarge/nx-node-sea/commit/2016c2f))
- add condition to bypass cache operations when NX_CACHE_PROJECT_GRAPH is false ([bdd69f3](https://github.com/getlarge/nx-node-sea/commit/bdd69f3))

### ❤️  Thank You

- getlarge

## 0.1.0 (2024-11-13)

### 🚀 Features

- update ESLint config and add postject dependency ([1d7024b](https://github.com/getlarge/nx-node-sea/commit/1d7024b))
- initial plugin implementation ([a9c3e92](https://github.com/getlarge/nx-node-sea/commit/a9c3e92))

### 🩹 Fixes

- make plugin platform aware ([1fa8ce5](https://github.com/getlarge/nx-node-sea/commit/1fa8ce5))

### ❤️  Thank You

- getlarge