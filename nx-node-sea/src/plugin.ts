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
import { dirname, join } from 'node:path';
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
  return join(workspaceDataDirectory, `sea-${hashObject(options)}.hash`);
}

function readTargetsCache(
  cachePath: string
): Record<string, Record<string, TargetConfiguration>> {
  if (existsSync(cachePath)) {
    return readJsonFile(cachePath);
  }
  return {};
}

function writeTargetsToCache(
  cachePath: string,
  targets: Record<string, Record<string, TargetConfiguration>>
) {
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
                // TODO: check if namedInputs work in this Nx version, otherwise create an issue
                // see https://discord.com/channels/1143497901675401286/1297849630859464754/1297849630859464754
                namedInputs: {
                  node: [
                    { runtime: 'node --version' },
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
      // { runtime: 'node --version' },
      // { env: 'NODE_OPTIONS' },
      // { externalDependencies: [] },
      'node',
      '{projectRoot}/sea-config.json',
      'production',
    ],
    // TODO: check if blobPath is relative, if yes append workspaceRoot
    outputs: [`{workspaceRoot}/${blobPath}`, `{workspaceRoot}/${nodeBinPath}`],
    dependsOn: [options.buildTarget],
    executor: 'nx:run-commands',
    options: {
      /**
       * @see https://nodejs.org/api/single-executable-applications.html
       * @todo update commands for win support
       */
      commands: [
        'node --experimental-sea-config {projectRoot}/sea-config.json',
        `cp $(command -v node) ${nodeBinPath}`,
        platform === 'darwin' && `codesign --remove-signature ${nodeBinPath}`,
        platform === 'darwin'
          ? `npx postject ${nodeBinPath} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`
          : `npx postject ${nodeBinPath} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
        platform === 'darwin' && `codesign --sign - ${nodeBinPath}`,
      ],
      parallel: false,
    },
  };
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
