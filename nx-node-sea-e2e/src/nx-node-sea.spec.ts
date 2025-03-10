import { execSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { inspect } from 'node:util';
import { NxJsonConfiguration, readJsonFile, writeJsonFile } from '@nx/devkit';

import type { NodeSeaPluginOptions, NodeSeaOptions } from 'nx-node-sea';

describe('nx-node-sea', () => {
  let projectDirectory: string;
  let seaConfig: NodeSeaOptions;

  beforeAll(() => {
    projectDirectory = createTestProject();

    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`npm install @getlarge/nx-node-sea@e2e`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
    updateNxJson(projectDirectory);
    seaConfig = createSeaConfig(projectDirectory);
  }, 15_000);

  afterAll(() => {
    // Cleanup the test project
    rmSync(projectDirectory, {
      recursive: true,
      force: true,
    });
  });

  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('npm ls @getlarge/nx-node-sea', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
  });

  it('should build the SEA', async () => {
    const cp = spawn('nx', ['run', 'sea-build', '--verbose'], {
      cwd: projectDirectory,
      stdio: 'inherit',
      timeout: 35_000,
      shell: true,
    });
    cp.stdout?.on('data', (data) => {
      console.log(data.trim().toString());
    });
    cp.stderr?.on('data', (data) => {
      console.warn(data.trim().toString());
    });
    const [code] = await once(cp, 'exit');

    expect(code).toBe(0);
    const outputDirectory = join(projectDirectory, dirname(seaConfig.output));
    const files = readdirSync(outputDirectory);
    expect(files).toContain(basename(seaConfig.output));
    expect(files).toContain('node');
  }, 45_000);

  it.todo('should run the SEA');
});

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
  const projectName = 'test-project';
  const projectDirectory = join(process.cwd(), 'tmp', projectName);

  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  // we need a node.js project to generate the single executable application (SEA)
  execSync(
    `npx --yes create-nx-workspace@latest ${projectName} --preset node-standalone --nxCloud=skip --no-interactive`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);
  console.log(
    inspect(readJsonFile(join(projectDirectory, 'project.json')), { depth: 3 })
  );

  // mock the build output
  const buildOutputDirectory = join(projectDirectory, 'dist', projectName);
  mkdirSync(buildOutputDirectory, { recursive: true });
  writeFileSync(
    join(buildOutputDirectory, 'main.js'),
    'console.log("Hello World");'
  );

  console.log(`Created dummy build output in "${buildOutputDirectory}"`);

  return projectDirectory;
}

function updateNxJson(projectDirectory: string): void {
  const nxJson: NxJsonConfiguration = readJsonFile(
    join(projectDirectory, 'nx.json')
  );
  nxJson.plugins ??= [];
  nxJson.plugins.push({
    plugin: '@getlarge/nx-node-sea',
    options: {
      seaTargetName: 'sea-build',
      buildTarget: 'build',
    } satisfies NodeSeaPluginOptions,
  });
  writeJsonFile(join(projectDirectory, 'nx.json'), nxJson);
}

function createSeaConfig(projectDirectory: string): NodeSeaOptions {
  const seaConfig = {
    main: 'dist/test-project/main.js',
    output: 'dist/test-project/main.blob',
  };
  writeJsonFile(join(projectDirectory, 'sea-config.json'), seaConfig);
  return seaConfig;
}
