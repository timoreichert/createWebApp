#!/usr/bin/env node
"use strict";

const lib = require(".");
const path = require("path");
const util = require("util");

const meow = require("meow");
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const semver = require("semver");
const Ora = require("ora");

const cli = meow(
  `Usage
    $ cwa <folder>

    Options
	  --skip-git do not create a git repository for the project
`,
  {
    flags: {
      "skip-git": {
        type: "boolean"
      }
    }
  }
);

const appName = cli.input[0];
const baseDir = process.cwd();
const appDir = path.resolve(baseDir, appName);
const srcDir = path.resolve(appDir, "src");
const index = {
  js: `var browserSync = require('browser-sync').create();
browserSync.init({
  server: ["node_modules", "src"],
  open: true,
  files: "src",
  logFileChanges: false,
  notify: false
});`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${appName}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>${appName}</h1>
  <script src="app.js"></script>
</body>
</html>`
};

const oraPromise = (action, options, skip) => {
  if (typeof action.then !== "function") {
    throw new TypeError("Parameter `action` must be a Promise");
  }

  const spinner = new Ora(options);
  spinner.start();

  return new Promise((resolve, reject) => {
    if (skip) {
      resolve(spinner.info(chalk.gray(`${options} skiped`)));
    } else {
      action.then(
        () => {
          resolve(spinner.succeed());
        },
        () => {
          reject(spinner.fail());
        }
      );
    }
  });
};

clear();
console.log(chalk.yellow(figlet.textSync("CreateWebApp") + cli.pkg.version));

if (cli.input.length !== 1) {
  cli.showHelp();
  process.exit(1);
}

console.log(
  chalk.yellow("create web app ") +
    chalk.blue(appName) +
    chalk.yellow(" in folder ") +
    chalk.blue(baseDir)
);

oraPromise(lib.mDir(appDir), chalk.yellow("mkdir ") + chalk.blue(appDir)).then(
  ora =>
    oraPromise(
      lib.runWithArgs("npm", ["init", "-y"], { cwd: appDir }),
      chalk.yellow("exec npm init -y")
    )
      .then(ora =>
        oraPromise(
          lib.runWithArgs("npm", ["install", "--save", "normalize.css"], {
            cwd: appDir
          }),
          chalk.yellow("npm install --save normalize.css")
        )
      )
      .then(ora =>
        oraPromise(
          lib.runWithArgs("browser-sync", ["--version"])
            .then(version => {
              if (semver.lt(version, "2.23.6")) {
                lib.runWithArgs("npm", ["i", "-g", "browser-sync"]);
              } else {
                return Promise.resolve(ora);
              }
            })
            .catch(() => lib.runWithArgs("npm", ["i", "-g", "browser-sync"])),
          chalk.yellow("check browser-sync")
        )
      )
      .then(ora =>
        oraPromise(
          lib.wFile(appDir, "index.js", index.js),
          chalk.yellow("write index.js to ") + chalk.blue(appDir)
        )
      )
      .then(ora =>
        oraPromise(
          lib.mDir(srcDir),
          chalk.yellow("mkdir " + chalk.blue(srcDir))
        )
      )
      .then(ora =>
        oraPromise(
          lib.wFile(srcDir, "index.html", index.html),
          chalk.yellow("write " + chalk.blue("index.html") + " to ") +
            chalk.blue(srcDir)
        )
      )
      .then(ora =>
        oraPromise(
          lib.wFile(srcDir, "app.js", 'console.log("Hello World"'),
          chalk.yellow("write " + chalk.blue("app.js") + " to ") +
            chalk.blue(srcDir)
        )
      )
      .then(ora =>
        oraPromise(
          lib.wFile(srcDir, "style.css", ""),
          chalk.yellow("write " + chalk.blue("style.css") + " to ") +
            chalk.blue(srcDir)
        )
      )
      .then(ora =>
        oraPromise(
          lib.wFile(appDir, ".gitignore", "node_modules\n"),
          chalk.yellow("write " + chalk.blue(".gitignore") + " to ") +
            chalk.blue(appDir),
          cli.flags.skipGit
        )
      )
      .then(ora =>
        oraPromise(
          lib.runWithArgs("git", ["init"], { cwd: appDir }),
          chalk.yellow("git init"),
          cli.flags.skipGit
        )
      )
      .then(ora =>
        oraPromise(
          lib.runWithArgs("git", ["add", "."], { cwd: appDir }),
          chalk.yellow("git add ."),
          cli.flags.skipGit
        )
      )
      .then(ora =>
        oraPromise(
          lib.runWithArgs("git", ["commit", "-m", '"Initial commit"'], {
            cwd: appDir
          }),
          chalk.yellow('git commit -m "Initial commit"'),
          cli.flags.skipGit
        )
      )
      .then(ora =>
        oraPromise(
          lib.runWithArgs("code", [appDir]),
          chalk.yellow("code ") + chalk.blue(appDir)
        )
      )
);
