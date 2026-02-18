'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { resolvePaths } = require('./paths');
const { readManifest } = require('./manifest');
const { removeProtocol } = require('./markers');

function uninstall({ home } = {}) {
  const paths = resolvePaths(home ? home : undefined);
  const { commandsDir, kilntwoDir, templatesDir, manifestPath } = paths;

  const manifest = readManifest({ manifestPath });
  if (manifest === null) {
    return { error: 'not-installed' };
  }

  const removed = [];
  const notFound = [];

  for (const file of manifest.files) {
    const absolutePath = path.join(paths.claudeDir, file.path);
    try {
      fs.unlinkSync(absolutePath);
      removed.push(absolutePath);
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        notFound.push(absolutePath);
        continue;
      }
      throw error;
    }
  }

  removeProtocol(path.join(process.cwd(), 'CLAUDE.md'));

  for (const dirPath of [templatesDir, kilntwoDir, commandsDir]) {
    try {
      fs.rmdirSync(dirPath);
    } catch (error) {
      if (
        error &&
        (error.code === 'ENOENT' ||
          error.code === 'ENOTEMPTY' ||
          error.code === 'EEXIST')
      ) {
        continue;
      }
      throw error;
    }
  }

  try {
    fs.unlinkSync(manifestPath);
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error;
    }
  }

  return { removed, notFound };
}

module.exports = { uninstall };
