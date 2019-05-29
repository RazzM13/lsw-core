import * as feathers from '@feathersjs/feathers';
import * as feathersErrors from '@feathersjs/errors';
import * as errors from './errors.cache.store.base';
import * as dalErrors from './errors.cache.dal';
import * as utils from './utils';
import * as util from 'util';
import * as AJV from 'ajv';


export default class BaseCacheStoreHooks {

  protected static async processParams(context: feathers.HookContext) {
    const {method, params} = context;

    /**
     * Validate request method and required params
     */

    // determine params type
    let paramsType;
    switch (method) {
      case 'find':
        paramsType = 'CachestoreFindParams';
        break;
      case 'get':
        paramsType = 'CachestoreGetParams';
        break;
      case 'create':
        paramsType = 'CachestoreCreateParams';
        break;
      case 'update':
        paramsType = 'CachestoreUpdateParams';
        break;
      case 'patch':
        paramsType = 'CachestorePatchParams';
        break;
      case 'remove':
        paramsType = 'CachestoreRemoveParams';
        break;
      default:
        throw new errors.InvalidMethod({method});
    }

    // validate params
    try {
      utils.parseData(params, paramsType); console.log('parseData', params);
    }
    catch(e) {
      throw new errors.InvalidParams({source: e});
    }

    // initialize defaults
    const {query} = params;
    query['$noSignatureValidation'] = query['$noSignatureValidation'] ? query['$noSignatureValidation'] : false;

    /**
     * Normalize params
     */

    let {keyID, id: cacheID} = params.query;
    keyID = keyID ? keyID.toUpperCase() : null;
    cacheID = cacheID ? cacheID.toUpperCase() : null;
    Object.assign(params.query, {keyID, id: cacheID});
    context.id = cacheID;

    return context;
  }

  protected static async processFindParams(context: feathers.HookContext) {
    const {service, params} = context;
    const {query} = params;

    // initialize defaults
    query['$limit'] = query['$limit'] ? query['$limit'] : 1000;
    query['$skip'] = query['$skip'] ? query['$skip'] : 0;
    query['$select'] = query['$select'] ? query['$select'] : ['id', 'keyID', 'metadata', 'metadataSignature'];

    return context;
  }

  protected static async validateCacheFormat(context: feathers.HookContext) {
    const cache = context.data ? context.data : context.result;

    // determine format type
    let formatType;
    switch (context.type) {
      case 'before':
        switch (context.method) {
          case 'patch':
          case 'create':
            formatType = 'CacheBase';
            break;
          case 'update':
            formatType = 'CacheFull';
            break;
        }
        break;

      case 'after':
        switch (context.method) {
          case 'find':
            formatType = 'CacheMeta';
            break;
          case 'get':
          case 'create':
          case 'update':
          case 'patch':
          case 'remove':
            formatType = 'CacheFull';
            break;
        }
        break;
    }

    // validate type resolution
    if (!formatType) {
      throw Error('Unable to determine cache format type!');
    }

    // validate cache format
    try {
      utils.validateData(cache, formatType, true);
    }
    catch (e) {
      throw new errors.InvalidCacheFormat({input: cache, source: e});
    }

    return context;
  }

  // protected static async validateCacheFormat(context: feathers.HookContext) {
  //   const cache = context.data ? context.data : context.result;
  //
  //   switch (context.type) {
  //     case 'before':
  //
  //       switch (context.method) {
  //         case 'patch':
  //         case 'update':
  //
  //           // check id property
  //           if (!cache.id) {
  //             throw new errors.MissingCacheEnvelopeProperty('id');
  //           }
  //
  //           // check keyID property
  //           if (!cache.keyID) {
  //             throw new errors.MissingCacheEnvelopeProperty('keyID');
  //           }
  //
  //         case 'create':
  //
  //           // check metadata property
  //           if (!cache.metadata) {
  //             throw new errors.MissingCacheEnvelopeProperty('metadata');
  //           }
  //
  //           // check contents property
  //           if (!cache.contents) {
  //             throw new errors.MissingCacheEnvelopeProperty('contents');
  //           }
  //
  //         default:
  //           break;
  //       }
  //
  //       break;
  //
  //     case 'after':
  //
  //       switch (context.method) {
  //
  //         case 'get':
  //
  //           // check contents property
  //           if (!cache.contents) {
  //             throw new errors.MissingCacheEnvelopeProperty('contents');
  //           }
  //
  //           // check contentsSignature property
  //           if (!cache.contentsSignature) {
  //             throw new errors.MissingCacheEnvelopeProperty('contentsSignature');
  //           }
  //
  //         case 'find':
  //
  //           // check id property
  //           if (!cache.id) {
  //             throw new errors.MissingCacheEnvelopeProperty('id');
  //           }
  //
  //           // check keyID property
  //           if (!cache.keyID) {
  //             throw new errors.MissingCacheEnvelopeProperty('keyID');
  //           }
  //
  //           // check metadata property
  //           if (!cache.metadata) {
  //             throw new errors.MissingCacheEnvelopeProperty('metadata');
  //           }
  //
  //           // check metadataSignature property
  //           if (!cache.metadataSignature) {
  //             throw new errors.MissingCacheEnvelopeProperty('metadataSignature');
  //           }
  //
  //           break;
  //
  //         default:
  //           break;
  //       }
  //
  //     default:
  //       break;
  //   }
  //
  //   return context;
  // }

  protected static async validateCacheType(context: feathers.HookContext) {
    const {service} = context;
    const cache = context.data ? context.data : context.result;
    const type = cache.metadata.type;

    // check type
    const expectedTypes = (service as any).allowedSchemas;
    if ( !utils.isValidType(type, expectedTypes) ) {
      const expectedFormats = expectedTypes.map((x: any) => (typeof x == 'string') ? x : x.toString());
      throw new errors.InvalidCacheMetadataType({input: type, expectedFormats});
    }

    return context;
  }

  // protected static async validateCacheMetadata(context: feathers.HookContext) {
  //   const {service, method} = context;
  //   const cache = context.data ? context.data : context.result;
  //   const {metadata} = cache;
  //   const {type, title, summary, permissions, createdAt, modifiedAt, expiresAt} = metadata;
  //
  //   if ( !utils.isValidObject(metadata) ) {
  //     throw new errors.InvalidCacheEnvelopeSection('metadata', {input: metadata});
  //   }
  //
  //   // check for insufficient or extraneous properties
  //   const propertyCount = Object.keys(metadata).length;
  //
  //   let expectedPropertyCount;
  //   if (method == 'create') {
  //     expectedPropertyCount = 4;
  //   } else {
  //     expectedPropertyCount = 7;
  //   }
  //
  //   if (propertyCount != expectedPropertyCount) {
  //     throw new errors.InvalidCacheEnvelopeSection('metadata', {input: metadata, propertyCount, expectedPropertyCount});
  //   }
  //
  //   // check type
  //   const expectedTypes = (service as any).AllowedSchemas;
  //   if ( !utils.isValidType(type, expectedTypes) ) {
  //     const expectedFormats = expectedTypes.map((x: any) => (typeof x == 'string') ? x : x.toString());
  //     throw new errors.InvalidOrMissingCacheEnvelopeSectionProperty('metadata', 'type', {input: type, expectedFormats});
  //   }
  //
  //   // check title
  //   if ( !utils.isValidTitle(title) ) {
  //     throw new errors.InvalidOrMissingCacheEnvelopeSectionProperty('metadata', 'title', {input: title});
  //   }
  //
  //   // check summary
  //   if ( !utils.isValidSummary(summary) ) {
  //     throw new errors.InvalidOrMissingCacheEnvelopeSectionProperty('metadata', 'summary', {input: summary});
  //   }
  //
  //   // check permissions
  //   if ( !utils.isValidPermissions(permissions) ) {
  //     throw new errors.InvalidOrMissingCacheEnvelopeSectionProperty('metadata', 'permissions', {input: permissions});
  //   }
  //
  //   // check contextual properties
  //   if (method != 'create') {
  //
  //     // check createdAt
  //     if ( !utils.isValidTimestamp(createdAt) ) {
  //       throw new errors.InvalidOrMissingCacheEnvelopeSectionProperty('metadata', 'createdAt', {input: createdAt});
  //     }
  //
  //     // check modifiedAt
  //     if ( !utils.isValidTimestamp(modifiedAt) ) {
  //       throw new errors.InvalidOrMissingCacheEnvelopeSectionProperty('metadata', 'modifiedAt', {input: modifiedAt});
  //     }
  //
  //     // check expiresAt
  //     if ( !utils.isValidTimestamp(expiresAt) ) {
  //       throw new errors.InvalidOrMissingCacheEnvelopeSectionProperty('metadata', 'expiresAt', {input: expiresAt});
  //     }
  //
  //  }
  //
  //   return context;
  // }

  protected static async validateCacheContents(context: feathers.HookContext) {
    const {app} = context;
    const DAL = app.get('DAL');
    const cache = context.data ? context.data : context.result;
    const {metadata, contents} = cache;
    const {type} = metadata;

    // acquire the validation schema
    if (!utils.validatorHasSchema(type)) {
      let schemaCache: any;
      try {
        schemaCache = await DAL.getByURL(type);
      }
      catch (e) {
        throw new errors.NoSuchSchemaCache({input: type, source: e});
      }
      const schema = schemaCache['contents']['schema'];
      utils.validatorAddSchema(schema, type);
    }

    // validate the cache's contents
    try {
      utils.validateData(contents, type, true);
    }
    catch (e) {
      throw new errors.InvalidCacheContents({input: cache, source: e});
    }

    return context;
  }

// protected static async validateCacheContents(context: feathers.HookContext) {
  //   const {app} = context;
  //   const DAL = app.get('DAL');
  //   const cache = context.data ? context.data : context.result;
  //   const {metadata, contents} = cache;
  //   const {type} = metadata;
  //
  //   // acquire the validation schema
  //   let schemaCache: any;
  //   try {
  //     schemaCache = await DAL.getByURL(type);
  //   }
  //   catch (e) {
  //     if (e instanceof dalErrors.NotFoundCache) {
  //       throw new errors.NotFoundSchemaCache(e.data);
  //     }
  //     throw e;
  //   }
  //
  //   // validate the cache's contents
  //   const schema = schemaCache['contents']['schema'];
  //   const ajv = new AJV({verbose: true, jsonPointers: true});
  //   ajv.validate(schema, contents);
  //
  //   // issue appropriate error
  //   if (ajv.errors) {
  //     let errorPropertyName;
  //     let errorPropertyPath;
  //     let errorPropertyFullName;
  //     let errorSectionName;
  //     let errorInput;
  //     let errorExpectedType;
  //     let errorExpectedPattern;
  //     let errorExpectedFormat;
  //     let errorData;
  //     const ajvError = ajv.errors.pop();
  //     const ajvErrorParams = ajvError.params as any;
  //     const ajvErrorDataPath = ajvError.dataPath;
  //     const ajvErrorDataPathParts = ajvErrorDataPath.split('/');
  //     switch(ajvError.keyword) {
  //       case 'required':
  //         errorPropertyName = ajvErrorParams.missingProperty;
  //         errorPropertyPath = ajvErrorDataPath;
  //         errorPropertyFullName = errorPropertyPath ? `#/${errorPropertyPath}/${errorPropertyName}` : `#/${errorPropertyName}`;
  //         errorSectionName = errorPropertyPath ? `contents/${errorPropertyPath}` : 'contents';
  //         errorInput = ajvError.data;
  //         errorExpectedFormat = schema;
  //         errorData = {input: errorInput, expectedProperty: errorPropertyFullName, expectedFormat: errorExpectedFormat};
  //         throw new errors.InvalidCacheEnvelopeSection(errorSectionName, errorData);
  //       case 'additionalProperties':
  //         errorPropertyName = ajvErrorParams.additionalProperty;
  //         errorPropertyPath = ajvErrorDataPath;
  //         errorPropertyFullName = errorPropertyPath ? `#/${errorPropertyPath}/${errorPropertyName}` : `#/${errorPropertyName}`;
  //         errorSectionName = errorPropertyPath ? `contents/${errorPropertyPath}` : 'contents';
  //         errorInput = ajvError.data;
  //         errorExpectedFormat = schema;
  //         errorData = {input: errorInput, unexpectedProperty: errorPropertyFullName, expectedFormat: errorExpectedFormat};
  //         throw new errors.InvalidCacheEnvelopeSection(errorSectionName, errorData);
  //       case 'type':
  //         errorPropertyPath = ajvErrorDataPathParts.slice(0, -1).join('/');
  //         errorPropertyName = ajvErrorDataPathParts[ajvErrorDataPathParts.length-1];
  //         errorPropertyFullName = errorPropertyPath ? `#/${errorPropertyPath}/${errorPropertyName}` : `#/${errorPropertyName}`;
  //         errorSectionName = errorPropertyPath ? `contents/${errorPropertyPath}` : 'contents';
  //         errorInput = ajvError.data;
  //         errorExpectedType = ajvError.schema;
  //         errorExpectedFormat = schema;
  //         errorData = {input: errorInput, property: errorPropertyFullName, expectedType: errorExpectedType,
  //                      expectedFormat: errorExpectedFormat};
  //         throw new errors.InvalidOrMissingCacheEnvelopeSectionProperty(errorSectionName, errorPropertyName, errorData);
  //       case 'pattern':
  //         errorPropertyPath = ajvErrorDataPathParts.slice(0, -1).join('/');
  //         errorPropertyName = ajvErrorDataPathParts[ajvErrorDataPathParts.length-1];
  //         errorPropertyFullName = errorPropertyPath ? `#/${errorPropertyPath}/${errorPropertyName}` : `#/${errorPropertyName}`;
  //         errorSectionName = errorPropertyPath ? `contents/${errorPropertyPath}` : 'contents';
  //         errorInput = ajvError.data;
  //         errorExpectedPattern = ajvError.schema;
  //         errorExpectedFormat = schema;
  //         errorData = {input: errorInput, property: errorPropertyFullName, expectedPattern: errorExpectedPattern,
  //                      expectedFormat: errorExpectedFormat};
  //         throw new errors.InvalidOrMissingCacheEnvelopeSectionProperty(errorSectionName, errorPropertyName, errorData);
  //       default:
  //         errorInput = ajvError.data;
  //         errorExpectedFormat = schema;
  //         errorData = {input: errorInput, expectedFormat: errorExpectedFormat, errors: {'ajvError': ajvError}};
  //         throw new errors.InvalidCache('Unhandled AJV error', errorData);
  //     }
  //   }
  //
  //   return context;
  // }

  protected static async assignCacheID(context: feathers.HookContext) {
    const {service, params} = context;
    const {query} = params;
    const {keyID} = query;
    const cache = context.data ? context.data : context.result;

    let cacheID = cache.id ? cache.id : utils.generateGUID(); //TODO: use keyID as node
    cacheID = cacheID.toUpperCase();

    cache.id = cacheID;
    cache.keyID = keyID;
    context.id = cacheID;

    return context;
  }

  // TODO: refine this
  protected static async timestampCache(context: feathers.HookContext) {
    const {service} = context;
    const cache = context.data ? context.data : context.result;
    const {metadata} = cache;
    const now = Date.now();

    // assign creation timestamp
    let createdAt = metadata.createdAt;
    if (createdAt == undefined) {
      createdAt = now;
    }
    metadata.createdAt = createdAt;

    // assign modification timestamp
    metadata.modifiedAt = now;

    // assign expiration timestamp
    let expiresAt = metadata.expiresAt;
    if (expiresAt == undefined) {
      expiresAt = -1;
    }
    metadata.expiresAt = expiresAt;

    return context;
  }

  protected static async _getKeyCacheByURL(url:string, DAL: any) {
    let keyCache: any;
    try {
      keyCache = await DAL.getByURL(url);
    }
    catch (e) {
      throw new errors.NoSuchKeyCache({input: url, source: e});
    }
    return keyCache;
  }

  protected static async _getKeyCache(publicKeyID: string, cacheID: string, scope:string, DAL: any) {
    const url = `lsw://keys@${scope}/${publicKeyID}/${cacheID}`;
    return this._getKeyCacheByURL(url, DAL);
  }

  protected static async _makeCacheSectionSignature(cache: any, scope:string, DAL: any, sectionID: string) {
    const {id: cacheID, keyID: publicKeyID} = cache;
    const sectionData = cache[sectionID];
    const publicKeyCache = await this._getKeyCache(publicKeyID, publicKeyID, scope, DAL);
    const secretKeyURL = publicKeyCache['contents']['sibling'];
    const secretKeyCache = await this._getKeyCacheByURL(secretKeyURL, DAL);
    const secretKeyPEM = secretKeyCache['contents']['key'];
    return utils.signCacheEnvelopeSection(cacheID, publicKeyID, sectionData, secretKeyPEM);
  }

  protected static async _signCacheSection(context: feathers.HookContext, sectionID: string) {
    const {app, params, service} = context;
    const DAL = app.get('DAL');
    const scope = (service as any).scope;
    const cache = context.data ? context.data : context.result;
    cache[`${sectionID}Signature`] = await this._makeCacheSectionSignature(cache, scope, DAL, sectionID);
    return context;
  }

  protected static async signCacheMetadata(context: feathers.HookContext) {
    return this._signCacheSection(context, 'metadata');
  }

  protected static async signCacheContents(context: feathers.HookContext) {
    return this._signCacheSection(context, 'contents');
  }

  protected static async validateCacheID(context: feathers.HookContext) {
    const {service, params, id} = context;
    const {query} = params;
    const {keyID} = query;
    const cache = context.data ? context.data : context.result;
    const {id: cacheID, keyID: cacheKeyID} = cache;

    if ( id && (id != cacheID) ) {
      throw new errors.MismatchedRequestParam('id', {input: cacheID, expected: id});
    }

    if ( keyID && (keyID != cacheKeyID) ) {
      throw new errors.MismatchedRequestParam('keyID', {input: cacheKeyID, expected: keyID});
    }

    return context;
  }

  protected static async _isCacheSectionSignatureValid(cache: any, scope:string, DAL: any, sectionID: string) {
    const {id: cacheID, keyID: publicKeyID} = cache;
    const sectionData = cache[sectionID];
    const sectionSignature = cache[`${sectionID}Signature`];
    const publicKeyCache = await this._getKeyCache(publicKeyID, publicKeyID, scope, DAL);
    const publicKeyPEM = publicKeyCache['contents']['key'];
    return utils.verifyCacheEnvelopeSection(cacheID, publicKeyID, sectionData, publicKeyPEM, sectionSignature);
  }

  protected static async _validateCacheSectionSignature(context: feathers.HookContext, sectionID: string) {
    const {app, params, service} = context;
    const DAL = app.get('DAL');
    const scope = (service as any).scope;
    const cache = context.data ? context.data : context.result;
    const skipValidation = params.query.$noSignatureValidation;

    const isValid = skipValidation || await this._isCacheSectionSignatureValid(cache, scope, DAL, sectionID);
    if (!isValid) {
      const errorData = {input: cache, scope, sectionID};
      throw new errors.InvalidCacheEnvelopeSectionSignature(sectionID, errorData);
    }

    return context;
  }

  protected static async validateCacheMetadataSignature(context: feathers.HookContext) {
    return this._validateCacheSectionSignature(context, 'metadata');
  }

  protected static async validateCacheContentsSignature(context: feathers.HookContext) {
    return this._validateCacheSectionSignature(context, 'contents');
  }

  // TODO: refine this
  protected static async filterFindQueryResult(context: feathers.HookContext) {
    const {error} = context;

    // early exit for undesired error types
    if (!(error instanceof utils.BatchProcessError)) {
      return context;
    }

    const {errors, hook} = error as any;
    const {result} = hook;
    if (errors.length) {
      const filtered = [];
      for (let item of result) {
        let isValid = true;
        for (let error of errors) {
          if (item.id == error.data.id) {
            isValid = false;
            break;
          }
        }
        if (isValid) {
          filtered.push(item);
        }
      }
      context.result = filtered;
    }
    return context;
  }

  protected static async retrieveCache(context: feathers.HookContext) {
    const {app, id, params} = context;
    const DAL = app.get('DAL');

    const cache = await DAL.get(id, params);
    context.result = cache;

    return context;
  }

  protected static async updateCache(context: feathers.HookContext) {
    const {app, id, params} = context;
    const DAL = app.get('DAL');
    const cache = context.data ? context.data : context.result;

    context.result = await DAL.update(id, cache, params);

    return context;
  }

  protected static async expireCache(context: feathers.HookContext) {
    const cache = context.data ? context.data : context.result;

    cache['metadata']['expiresAt'] = 0;
    delete cache['metadataSignature'];
    delete cache['contentsSignature'];

    return context;
  }

  public static make(): Partial<feathers.HooksObject> {
    const hooks = this;
    return Object.freeze(utils.patchHooksThis({
      before: {
        all:    [ utils.TagRequest('CacheStore'), hooks.processParams ],
        find:   [ hooks.processFindParams ],
        create: [
                  hooks.validateCacheFormat,
                  // hooks.validateCacheMetadata,
                  hooks.validateCacheType,
                  hooks.validateCacheContents,
                  hooks.assignCacheID,
                  hooks.timestampCache,
                  hooks.signCacheMetadata,
                  hooks.signCacheContents
                ],
        update: [
                  hooks.validateCacheFormat,
                  hooks.validateCacheID,
                  // hooks.validateCacheMetadata,
                  hooks.validateCacheType,
                  async function(context: feathers.HookContext<any>) {
                    const cache = context.data ? context.data : context.result;
                    const isCacheSigned = cache['metadataSignature'] || cache['contentsSignature'];
                    // this is a cache transfer operation
                    if (isCacheSigned) {
                      context = await hooks.validateCacheMetadataSignature(context);
                      context = await hooks.validateCacheContentsSignature(context);
                    }
                    // this is a cache update operation
                    else {
                      context = await hooks.validateCacheContents(context);
                      context = await hooks.timestampCache(context);
                      context = await hooks.signCacheMetadata(context);
                      context = await hooks.signCacheContents(context);
                    }
                    return context;
                  }
                ],
        remove: [
                  hooks.retrieveCache,
                  hooks.expireCache,
                  hooks.updateCache
                ],
      },
      after: {
        get:  [
                // hooks.validateCacheFormat,
                hooks.validateCacheID,
                // hooks.validateCacheMetadataSignature,
                // hooks.validateCacheContentsSignature
              ],
        find: [
                // utils.batchProcess(hooks.validateCacheFormat),
                // utils.batchProcess(hooks.validateCacheID),
                // utils.batchProcess(hooks.validateCacheMetadataSignature)
              ]
      },
      error: {
        all:  [ utils.WrapLayerErrors(errors.BaseCachestoreLayerError, errors.GeneralError) ],
        find: [ hooks.filterFindQueryResult ]
      }
    }, hooks));
  }

}
