/* eslint-disable */

const Module = require('module');
const fs = require('fs');

function registerAssetExtension(ext, mimeType) {
  Module._extensions[ext] = function (module, fn) {
    const base64 = fs.readFileSync(fn).toString('base64');
    module._compile(`module.exports="data:${mimeType};base64,${base64}"`, fn);
  };
}

registerAssetExtension('.png', 'image/png');
registerAssetExtension('.webp', 'image/webp');
