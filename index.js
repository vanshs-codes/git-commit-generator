#!/usr/bin/env node

import 'dotenv/config';
import { exec } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import clipboard from 'clipboardy';
import fs from 'fs';
import path from 'path';
import os from 'os';

function getApiKey() {
  const configPath = path.join(os.homedir(), '.gcm-config.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.GEMINI_API_KEY;
    }
  } catch (error) {
    
  }

  // fallback to .env file
  return process.env.GEMINI_API_KEY;
}

async function getStagedDiff() {
  return new Promise((resolve, reject) => {
    exec('git diff --cached', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(new Error(stderr));
        return;
      }
      resolve(stdout);
    });
  });
}

// async function getCommitMessage(diff) {
//   const API_KEY = process.env.GEMINI_API_KEY;

//   if (!API_KEY) {
//     throw new Error('gemini api key is not available');
//   }

//   const genAI = new GoogleGenerativeAI(API_KEY);
//   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

//   const prompt = `
//     Based on the following code changes from a 'git diff --cached' command,
//     please generate a concise and professional Git commit message.

//     The commit message should follow the Conventional Commits specification.
//     It should be in the format: <type>(<scope>): <subject>
//     - <type> should be one of: feat, fix, chore, docs, style, refactor, test.
//     - <scope> is optional and should describe the part of the codebase affected.
//     - <subject> should be a short summary of the change, starting with a lowercase letter and without a period at the end.

//     Here are the code changes:
//     ---
//     ${diff}
//     ---
//   `;

//   const result = await model.generateContent(prompt);
//   const response = await result.response;

//   const rawText = response.text().trim();

//   console.log(chalk.bgRed.white("\n--- DEBUG: RAW AI OUTPUT ---"));
//   console.log(rawText);
//   console.log(chalk.bgRed.white("--- END DEBUG ---"));

//   return rawText.split('\n')[0];
// }

async function getCommitMessage(diff) {
  const API_KEY = getApiKey();

  if (!API_KEY) {
    throw new Error('gemini api key is neither available in .gcm-config.json nor in .env');
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    Based on the following code changes from a 'git diff --cached' command,
    please generate ONLY the git commit message and nothing else.
    The commit message must follow the Conventional Commits specification.
    It should be in the format: <type>(<scope>): <subject>
    - <type> should be one of: feat, fix, chore, docs, style, refactor, test.
    - <scope> is optional.
    - <subject> should be a short summary, lowercase, without a period at the end.

    Here are the code changes:
    ---
    ${diff}
    ---
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const rawText = response.text().trim();

//   console.log(chalk.bgRed.white("\n--- DEBUG: RAW AI OUTPUT ---"));
//   console.log(rawText);
//   console.log(chalk.bgRed.white("--- END DEBUG ---"));

  const commitRegex = /^(feat|fix|chore|docs|style|refactor|test)(\(.*\))?: .*$/m;
  const match = rawText.match(commitRegex);

  if (match) {
    return match[0];
  } else {
    console.log(chalk.yellow("Warning: AI response did not follow Conventional Commit format. Using first line."));
    return rawText.split('\n')[0];
  }
}

async function main() {
  const spinner = ora(chalk.cyan('Checking for staged changes...')).start();

  try {
    const diff = await getStagedDiff();

    if (!diff) {
      spinner.succeed(chalk.green('No staged changes found. You\'re all clear!'));
      return;
    }

    spinner.text = chalk.cyan('Crafting a commit message with Gemini AI...');
    const commitMessage = await getCommitMessage(diff);
    spinner.succeed(chalk.green('Generated commit message successfully!'));

    console.log(chalk.yellow('\nSuggested Commit Message:'));
    console.log(chalk.bold.white('--------------------------------------'));
    console.log(chalk.bold.white(commitMessage));
    console.log(chalk.bold.white('--------------------------------------\n'));

    const { shouldCopy } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCopy',
        message: chalk.blue('Do you want to copy this message to your clipboard?'),
        default: true,
      },
    ]);

    if (shouldCopy) {
      await clipboard.write(commitMessage);
      console.log(chalk.green('✅ Message copied to clipboard!'));
    }

  } catch (error) {
    spinner.fail(chalk.red('An error occurred.'));
    console.error(chalk.red.bold(error.message));
  }
}

main();