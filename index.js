#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

module.exports = {
  runWithArgs: (command, args , options) =>
    new Promise((resolve, reject) =>
      execFile(command, args, options, (error, stdout, stderr) => (error ? reject(error) : resolve(stdout)))
    ),
  mDir: dir =>
    new Promise((resolve, reject) =>
      fs.lstat(dir, (err, stats) => {
        if (err) {
          if (err.code === "ENOENT") {
            fs.mkdir(dir, e => (e ? reject(e) : resolve(dir)));
          } else {
            reject(err);
          }
        } else {
          if (stats.isDirectory()) {
            resolve(dir);
          } else {
            reject(`${dir} is not a directory`);
          }
        }
      })
    ),
  wFile: (dir, fileName, content) =>
    new Promise((resolve, reject) =>
      fs.writeFile(
        path.resolve(dir, fileName),
        content,
        err => (err ? reject(err) : resolve(fileName))
      )
    )
};
