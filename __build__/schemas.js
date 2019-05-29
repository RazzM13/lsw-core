const fs = require('fs');
const util = require('util');
const process = require('process');
const jsonSchemaToTypescript = require('json-schema-to-typescript');

const outDir = 'out';
const srcDir = 'src';
const validationFile = 'schemaTypes.ts';
const validationDir = 'data/schemas';
const schemaFilesDir = '__data__/schemas';

const schemaFiles = fs.readdirSync(schemaFilesDir).filter( (x) => (/^schema/.test(x)) );

/*
 * generate typescript definitions
 */

// generate a map of all schema definitions
const schemaMap = {
  $id: "schemamap",
  title: "SchemaMap",
  type: "object",
  properties: {},
  additionalProperties: false
};
for (const schemaFile of schemaFiles) {
  schemaMap.properties[schemaFile] = {"$ref": schemaFile};
}

// generate typescript definitions and commit them to file
jsonSchemaToTypescript.compile(schemaMap, 'SchemaMap', {
  cwd: schemaFilesDir,
  unreachableDefinitions: true,
  declareExternallyReferenced: true
})
.then( (typescript) => { fs.writeFileSync(`${srcDir}/${validationFile}`, typescript) } )
.catch((e) => {console.error(e); process.exit(1); });

/*
 * copy schemas to app folder
 */

// ensure destination folder exists
try {
  fs.mkdirSync(`${outDir}/${validationDir}`);
} catch (e) {
  if (e.code != 'EEXIST') {
    throw e;
  }
}

// do the copy operation
for (const schemaFile of schemaFiles) {
  fs.copyFileSync(`${schemaFilesDir}/${schemaFile}`, `${outDir}/${validationDir}/${schemaFile}`);
}

/*
 * generate the schema index
 */

// index schemas
const schemaRequireMap = {};
for (const schemaFile of schemaFiles) {
  const schema = fs.readFileSync(`${schemaFilesDir}/${schemaFile}`, {encoding: 'utf8'});
  const schemaTitle = JSON.parse(schema)['title'];
  schemaRequireMap[schemaTitle] = `require('./${schemaFile}')`;
}
let schemaIndex = util.format('%o', schemaRequireMap).replace(/"/g, '');
schemaIndex = `"use strict";\n module.exports = ${schemaIndex};`;

// commit index to file
fs.writeFileSync(`${outDir}/${validationDir}/index.js`, schemaIndex);
