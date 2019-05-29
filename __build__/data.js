const fs = require('fs');
const Handlebars = require('handlebars');
const child_process = require('child_process');
const utils = require('../out/utils');

function recursiveListDir(path) {
  let r = [];
  const dirents = fs.readdirSync(path, {withFileTypes: true});
  for (const dirent of dirents) {
    const direntPath = `${path}/${dirent.name}`;
    if (dirent.isDirectory()) {
      r = r.concat(recursiveListDir(direntPath));
    } else {
      r.push(direntPath);
    }
  }
  return r;
}

// initialize template values
const outBaseDir = 'out';
const pubKeyFilename = '__build__/pubkey.pem';
const pubKeyIDFilename = `${pubKeyFilename}.id`;
const pubKeyPEM = fs.readFileSync(pubKeyFilename, {encoding: 'utf8'}).trim().replace(/\n/g, '');
const pubKeyID = fs.readFileSync(pubKeyIDFilename, {encoding: 'utf8'}).trim().toUpperCase();
const pubKeyAlgo = 'Ed25519';
const secKeyFilename = '__build__/key.pem';
const secKeyIDFilename = `${secKeyFilename}.id`;
const secKeyPEM = fs.readFileSync(secKeyFilename, {encoding: 'utf8'}).trim().replace(/\n/g, '');
const secKeyID = fs.readFileSync(secKeyIDFilename, {encoding: 'utf8'}).trim().toUpperCase();
const secKeyAlgo = 'Ed25519';
const templateValues = {
  pubKeyPEM,
  pubKeyID,
  pubKeyAlgo,
  secKeyPEM,
  secKeyID,
  secKeyAlgo
}
const nowTimestamp = Date.now();
console.log('Template values:', templateValues);

// render templates
const filesBaseDir = '__data__/cachestore';
const templateFiles = recursiveListDir(filesBaseDir);
for (const templateFile of templateFiles) {
  const template = fs.readFileSync(templateFile, {encoding: 'utf8'});
  let rendition = Handlebars.compile(template)(templateValues);
  const renditionFile = `${outBaseDir}/${templateFile.replace('__data__', 'data')}`;
  const renditionPath = renditionFile.split('/').slice(0, -1).join('/');
  const isCache = /json$/.test(renditionFile);
  if (isCache) {
      const cache = JSON.parse(rendition);
      cache['metadata']['createdAt'] = nowTimestamp;
      cache['metadata']['modifiedAt'] = cache['metadata']['createdAt'];
      cache['metadata']['expiresAt'] = -1;
      cache['metadataSignature'] = utils.signCacheEnvelopeSection(cache['id'], cache['keyID'], cache['metadata'], secKeyPEM);
      cache['contentsSignature'] = utils.signCacheEnvelopeSection(cache['id'], cache['keyID'], cache['contents'], secKeyPEM);
      rendition = JSON.stringify(cache);
  }
  try {
    fs.mkdirSync(renditionPath, {recursive: true});
  } catch (e) {}
  fs.writeFileSync(renditionFile, rendition);
  console.log(`Finished rendering: ${templateFile}`);
}
