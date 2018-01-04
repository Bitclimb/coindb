const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const { Console } = require('console');
const dateTime = require('date-time');
let logger = null;
module.exports = opts => (...args) => {
  if (opts) {
    console.log('[CoinDb:debug]', ...args);
  } else {
    fsLog(`[CoinDb:debug: ${dateTime()}]`, ...args);
  }
};

function fsLog(...args) {
  if (logger !== null) {
    return logger.log(...args);
  }
  const logpath = path.resolve(path.join(process.env.HOME, '.coindb'));
  mkdirp.sync(logpath);
  const output = fs.createWriteStream(path.join(logpath, 'coindb.log'));
  const errorOutput = fs.createWriteStream(path.join(logpath, 'coindb.err'));
  logger = new Console(output, errorOutput);
  return logger.log(...args);
}
