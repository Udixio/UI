#!/usr/bin/env node

import { Command } from 'commander';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { loadFromPath } from '../src';

const program = new Command();

async function runOnce(configPath: string) {
  try {
    console.log(chalk.blue('🔨 Building theme from'), chalk.cyan(configPath));
    await loadFromPath(configPath);
    console.log(chalk.green('✅ Theme built successfully!'));
  } catch (error) {
    console.error(
      chalk.red('❌ Build failed:'),
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

async function watchMode(configPath: string) {
  console.log(chalk.yellow('👀 Watching for changes...'));

  // Build initial
  await runOnce(configPath);

  // Setup watcher
  const exts = ['.ts', '.js', '.mjs', '.cjs'];
  const base = configPath.replace(/\.(ts|js|mjs|cjs)$/i, '');
  const files = exts.map((e) => base + e);

  const watcher = chokidar.watch(files, {
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on('change', async (path) => {
    console.log(chalk.gray(`\n📝 File changed:`), chalk.cyan(path));
    try {
      await runOnce(configPath);
    } catch (error) {
      console.error(chalk.red('Build failed, waiting for next change...\n'));
    }
  });

  watcher.on('error', (error) => {
    console.error(chalk.red('❌ Watcher error:'), error);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Stopping watcher...'));
    watcher.close();
    process.exit(0);
  });
}

program
  .name('@udixio/theme')
  .description('Build and watch theme configurations')
  .version('1.0.0');

program
  .command('build')
  .description('Build theme from configuration file')
  .option('-w, --watch', 'watch for changes and rebuild automatically')
  .option('-c, --config <path>', 'path to config file', './theme.config')
  .action(async (options) => {
    try {
      if (options.watch) {
        await watchMode(options.config);
      } else {
        await runOnce(options.config);
      }
    } catch (error) {
      console.error(
        chalk.red('💥 Unexpected error:'),
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

program.parse();
