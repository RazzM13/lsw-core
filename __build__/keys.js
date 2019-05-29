const fs = require('fs');
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const arrayBufferToHex = require('array-buffer-to-hex');

function B64toPEM(b64) {
  const pemHeader = '-----BEGIN KEY-----';
  const pemFooter = '-----END KEY-----';
  return `${pemHeader}\n${b64}\n${pemFooter}`;
}

const keys = nacl.sign.keyPair();

const secretKeyDER = keys['secretKey'];
const secretKeyB64 = naclUtil.encodeBase64(secretKeyDER);
const secretKeyPEM = B64toPEM(secretKeyB64);
const secretKeyID = arrayBufferToHex(nacl.hash(secretKeyDER));

const publicKeyDER = keys['publicKey'];
const publicKeyB64 = naclUtil.encodeBase64(publicKeyDER);
const publicKeyPEM = B64toPEM(publicKeyB64);
const publicKeyID = arrayBufferToHex(nacl.hash(publicKeyDER));

const secretKeyFilename = 'key.pem';
const secretKeyIDFilename = `${secretKeyFilename}.id`;
fs.writeFileSync(secretKeyFilename, secretKeyPEM);
fs.writeFileSync(secretKeyIDFilename, secretKeyID);

const publicKeyFilename = 'pubkey.pem';
const publicKeyIDFilename = `${publicKeyFilename}.id`;
fs.writeFileSync(publicKeyFilename, publicKeyPEM);
fs.writeFileSync(publicKeyIDFilename, publicKeyID);
