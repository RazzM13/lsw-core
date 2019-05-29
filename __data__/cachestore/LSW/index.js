"use strict";
module.exports = {
  APPS: {},
  GLOBALS: {},
  KEYS: {
    '{{pubKeyID}}': require('./KEYS/PubKey.json')
  },
  PATCHES: {},
  SCHEMAS: {
    'APPCACHESCHEMA': require('./SCHEMAS/AppCacheSchema.json'),
    'PUBLICKEYCACHESCHEMA': require('./SCHEMAS/PublicKeyCacheSchema.json'),
    'SECRETKEYCACHESCHEMA': require('./SCHEMAS/SecretKeyCacheSchema.json'),
    'PATCHCACHESCHEMA': require('./SCHEMAS/PatchCacheSchema.json'),
    'SCHEMACACHESCHEMA': require('./SCHEMAS/SchemaCacheSchema.json')
  },
}
