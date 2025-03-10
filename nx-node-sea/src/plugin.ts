import {
  CreateNodesContext,
  createNodesFromFiles,
  CreateNodesV2,
  joinPathFragments,
  readJsonFile,
  TargetConfiguration,
  writeJsonFile,
} from '@nx/devkit';
import { calculateHashForCreateNodes } from '@nx/devkit/src/utils/calculate-hash-for-create-nodes';
import { existsSync } from 'node:fs';
import { dirname, join, posix, win32 } from 'node:path';
import { platform, versions } from 'node:process';
import { combineGlobPatterns } from 'nx/src/utils/globs';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';
import { hashObject } from 'nx/src/hasher/file-hasher';
import * as semver from 'semver';

/**
 * @see https://nodejs.org/api/single-executable-applications.html#generating-single-executable-preparation-blobs
 */
export interface NodeSeaOptions {
  main: string;
  output: string;
  /**
   * @default false
   */
  disableExperimentalSEAWarning?: boolean;
  /**
   * @default false
   */
  useSnapshot?: boolean;
  /**
   * @default false
   */
  useCodeCache?: boolean;
  /**
   * optional
   */
  assets?: Record<string, string>;
}

export interface NodeSeaPluginOptions {
  buildTarget: string;
  seaTargetName?: string;
}

function getCachePath(options: NodeSeaPluginOptions) {
  return join(
    workspaceDataDirectory,
    `sea-${platform}-${hashObject(options)}.hash`
  );
}

function readTargetsCache(
  cachePath: string
): Record<string, Record<string, TargetConfiguration>> {
  if (process.env.NX_CACHE_PROJECT_GRAPH === 'false') {
    return {};
  }
  if (existsSync(cachePath)) {
    return readJsonFile(cachePath);
  }
  return {};
}

function writeTargetsToCache(
  cachePath: string,
  targets: Record<string, Record<string, TargetConfiguration>>
) {
  if (process.env.NX_CACHE_PROJECT_GRAPH === 'false') {
    return;
  }
  writeJsonFile(cachePath, targets);
}

export const createNodesV2: CreateNodesV2<Partial<NodeSeaPluginOptions>> = [
  combineGlobPatterns(['**/sea-config.json']),
  async (configFilePaths, options, context) => {
    const nodeVersion = getNodeVersion();
    if (semver.lt(nodeVersion, '20.0.0')) {
      throw new Error('Node SEA requires Node.js 20 or higher');
    }

    const opts = normalizeOptions(options ?? {});
    const cachePath = getCachePath(opts);
    const targetsCache = readTargetsCache(cachePath);
    const calculatedTargets: Record<
      string,
      Record<string, TargetConfiguration>
    > = {};

    try {
      return await createNodesFromFiles(
        async (configFilePath, _options, context) => {
          // TODO: validate sea options
          const projectRoot = dirname(configFilePath);
          const hash = await calculateHashForCreateNodes(
            projectRoot,
            opts,
            context
          );

          const targets =
            targetsCache[hash] ??
            buildSeaTargets(configFilePath, opts, context);

          calculatedTargets[hash] = targets;
          return {
            projects: {
              [projectRoot]: {
                namedInputs: {
                  node: [
                    { runtime: 'node --version' },
                    { runtime: 'node --print "process.arch"' },
                    { env: 'NODE_OPTIONS' },
                    { externalDependencies: ['postject'] },
                  ],
                },
                metadata: {
                  description: 'Node SEA',
                  technologies: ['node.js'],
                },
                root: projectRoot,
                targets,
              },
            },
          };
        },
        configFilePaths,
        options,
        context
      );
    } finally {
      writeTargetsToCache(cachePath, calculatedTargets);
    }
  },
];

function getSeaTargetConfiguration(
  options: NodeSeaPluginOptions,
  nodeSeaOptions: Partial<NodeSeaOptions>
): TargetConfiguration {
  const blobPath = nodeSeaOptions.output;
  const nodeBinPath = join(dirname(blobPath), 'node');
  // TODO: add nodeSeaOptions.assets to inputs??

  return {
    cache: true,
    inputs: [
      'node',
      '{projectRoot}/sea-config.json',
      'production',
      {
        externalDependencies: ['postject'],
      },
      {
        runtime: 'node --version',
      },
      {
        runtime: 'node --print "process.arch"',
      },
    ],
    // TODO: check if blobPath is relative, if yes append workspaceRoot
    outputs: [`{workspaceRoot}/${blobPath}`, `{workspaceRoot}/${nodeBinPath}`],
    dependsOn: [options.buildTarget],
    executor: 'nx:run-commands',
    options: {
      /**
       * @see https://nodejs.org/api/single-executable-applications.html
       */
      commands: getSeaCommands({ nodeBinPath, blobPath }),
      parallel: false,
    },
  };
}

function getSeaCommands(options: {
  nodeBinPath: string;
  blobPath: string;
  sign?: boolean;
}): string[] {
  const { nodeBinPath, blobPath, sign = false } = options;
  if (platform === 'darwin') {
    return [
      'node --experimental-sea-config {projectRoot}/sea-config.json',
      `cp $(command -v node) ${nodeBinPath}`,
      `codesign --remove-signature ${nodeBinPath}`,
      `npx postject ${nodeBinPath} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`,
      `codesign --sign - ${nodeBinPath}`,
    ];
  } else if (platform === 'linux') {
    return [
      'node --experimental-sea-config {projectRoot}/sea-config.json',
      `cp $(command -v node) ${nodeBinPath}`,
      `npx postject ${nodeBinPath} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
    ];
  } else if (platform === 'win32') {
    const _nodeBinPath = join(
      dirname(nodeBinPath.replaceAll(posix.sep, win32.sep)),
      'node.exe'
    );
    const _blobPath = blobPath.replaceAll(posix.sep, win32.sep);
    return [
      'node --experimental-sea-config {projectRoot}/sea-config.json',
      `node -e "require('fs').copyFileSync(process.execPath, 'main.exe')"`,
      ...(sign ? [`signtool remove /s 'main.exe' `] : []),
      // TODO: check if powershell or command prompt
      `npx postject main.exe NODE_SEA_BLOB ${_blobPath} \` --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8bß5df1996b2`,
      ...(sign ? [`signtool sign /fd SHA256 main.exe`] : []),
      `mv main.exe ${_nodeBinPath}`,
    ];
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

function getNodeVersion() {
  return versions.node;
}

function buildSeaTargets(
  configFilePath: string,
  options: NodeSeaPluginOptions,
  context: CreateNodesContext
) {
  const absoluteConfigFilePath = joinPathFragments(
    context.workspaceRoot,
    configFilePath
  );
  const nodeSeaOptions = readJsonFile(absoluteConfigFilePath) as NodeSeaOptions;
  const targets: Record<string, TargetConfiguration> = {};
  targets[options.seaTargetName] = getSeaTargetConfiguration(
    options,
    nodeSeaOptions
  );
  return targets;
}

function normalizeOptions(
  options: Partial<NodeSeaPluginOptions>
): NodeSeaPluginOptions {
  return {
    seaTargetName: options.seaTargetName ?? 'sea-build',
    buildTarget: options.buildTarget ?? 'build',
  };
}
