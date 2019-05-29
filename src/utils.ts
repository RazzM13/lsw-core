import * as process from 'process';
import * as feathers from '@feathersjs/feathers';
import * as errors from '@feathersjs/errors';
import * as base64js from 'base64-js';
import * as uuid from 'uuid/v1';
import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import * as AJV from 'ajv';
import * as qs from 'qs';

import hexToArrayBuffer = require('hex-to-array-buffer');
import arrayBufferToHex = require('array-buffer-to-hex');

const parseTimestring: any = require('timestring');

const mergeOptions: any = require('merge-options');
const dataSchemas: any = require('./data/schemas/index');

/*
 * Miscelaneous utilities
 */

 export const isDevModeOn = () => {
   return (process.env.NODE_ENV.toUpperCase() == 'DEVELOPMENT');
 }

 export const getTimestampFromTimestring = (timestring: string, now: number) => {
   let r = now, offset = 0, offsetSign = '+';

   if (/^[+-]/.test(timestring)) {
     offsetSign = timestring[0];
     timestring = timestring.substring(1);
     offset = parseTimestring(timestring);
   } else if (timestring != 'now') {
     r = parseInt(timestring);
   }

   if (offsetSign == '+') {
     r += offset;
   } else {
     r -= offset;
   }

   return r;
 }

/*
 * Hook utilities
 */

export class BatchProcessErrorItem extends errors.GeneralError {}

export class BatchProcessError extends errors.GeneralError {
    constructor(errors: any[]) {
      const msg = 'Unable to process all items';
      super(msg, {
        errors
      });
    }
}

export const batchProcess = (fn: (context: any) => Promise<feathers.HookContext<any>>): feathers.Hook => {
  return function(context) {
    const batch = context.result.map(
      (x: any) => {
        const xContext = Object.assign({}, context, {
            id: x.id,
            result: x
        });
        return fn.call(this, xContext).catch( (err: any) => new BatchProcessErrorItem(err, x) );
      }
    );
    return Promise.all(batch)
                  .then(
                    (results: any[]) => {
                      const failures = results.filter( (x: any) => x instanceof BatchProcessErrorItem);
                      if (failures.length) {
                        throw new BatchProcessError(failures);
                      }
                      return context;
                    }
                  );
   }
}

export const patchHooksThis = (hooks: any, thisArg: any): Partial<feathers.HooksObject> => {
  for (let k in hooks) {
    const hook = hooks[k];
    for (let method in hook) {
      hook[method] = hook[method].map( (fn: any) => (fn.bind(thisArg)) );
    }
  }
  return hooks;
}

export const logError = async (context: feathers.HookContext) => {
  const {app, error} = context;
  const {logger} = app.get('DI');
  if (!isDevModeOn()) {
    logger.error(JSON.stringify(error.toJSON()));
  }
  return context;
}

export const sanitizeError = async (context: feathers.HookContext) => {
  const {error} = context;
  if (!isDevModeOn()) {
    delete error.stack;
    delete error.errors;
  }
  return context;
}

export const TagRequest = function(requestLayer: string) {
  return async (context: feathers.HookContext) => {
    const {params} = context;
    params.requestID = generateGUID();
    params.requestLayer = requestLayer;
    return context;
  }
}

export const logRequest = async (context: feathers.HookContext) => {
  const {app, method, params, data} = context;
  const {logger} = app.get('DI');
  const now = Date.now();
  logger.info(`${now} ${params.requestLayer} - Processing request #${params.requestID}`);
  if (isDevModeOn()) {
    logger.debug({method, params, data});
  }
  return context;
}

export const WrapLayerErrors = function(BaseLayerError: any, GeneralLayerError: any) {
  return async (context: feathers.HookContext) => {
    const {error, method, params, data} = context;

    let wrappedError;
    if (error instanceof BaseLayerError) {
      wrappedError = error;
    }
    else {
      let wrappedErrorData: any = {method, params, data, errors: {source: getErrorInfo(error)}};
      wrappedError = new GeneralLayerError(params.requestID, wrappedErrorData);
    }
    context.error = wrappedError;

    return context;
  }
}

// export const TranslateLayerError = function(SourceLayerError: any, TargetLayerError: any) {
//   return async (context: feathers.HookContext) => {
//     const {error, method, params, data} = context;
//
//     let translatedError = error;
//     if (error instanceof SourceLayerError) {
//       let wrappedErrorData: any = {method, params, data, errors: {source: getErrorInfo(error)}};
//       translatedError = new GeneralLayerError(params.requestID, wrappedErrorData);
//     }
//     context.error = translatedError;
//
//     return context;
//   }
// }

/*
 * Validation utilities
 */

 export const isValidObject = (x: any) => {
   return ( (typeof x == 'object') && (!Array.isArray(x)) );
 }

 export const isValidURL = (x: string) => {
   return ( (typeof(x) == 'string') && (x.match(/^(lsw:\/\/)(\w+(@?\w*)?\/)(([\w]+\/)?([-\w]+)?)?(\?[\[\]$\w=&]*)?$/i)) );
 }

 // TODO: maybe a isValidCacheURL???

 export const isValidType = (x: string, allowedTypes?: RegExp[]) => {
   if (isValidURL(x)) {
     if (allowedTypes) {
       let r = false;
       for (const allowedType of allowedTypes) {
         r = allowedType.test(x);
         if (r) { break; }
       }
       return r;
     }
     return true;
   }
   return false;
 }

 export const isValidTitle = (x: any) => {
   return ( (typeof(x) == 'string') && (x.length <= 255) );
 }

 export const isValidSummary = (x: any) => {
   return ( (typeof(x) == 'string') && (x.length <= 255) );
 }

 // TODO: refine this
 export const isValidPermissions = (x: any) => {
   return (typeof(x) == 'object');
 }

 // TODO: refine this
 export const isValidTimestamp = (x: any) => {
   return (typeof(x) == 'number');
 }

 // TODO: refine this
 export const isValidSignature = (x: any) => {
   return (typeof(x) == 'string');
 }

 export const isValidGeohash = (x: any) => {
   return ( (typeof(x) == 'string') && (/^[23456789bBCdDFgGhHjJKlLMnNPqQrRtTVWX]{1,10}$/.test(x)) );
 }

 export const isValidHashtag = (x: any) => {
   return ( (typeof(x) == 'string') && (/^#/.test(x)) );
 }

 /*
  * Data conversion utilities
  */

  export class InvalidURLError extends errors.GeneralError {
    constructor(url: string) {
      const msg = 'Invalid URL';
      const data = {
        url
      };
      super(msg, data);
    }
  }

 export const getLswPathComponents = (path: string) => {
   const [scopedPartition, keyID, cacheID] = path.split('/');
   const scopedPartitionParts = scopedPartition.split('@');
   const partition = scopedPartitionParts[0];
   const scope = scopedPartitionParts[1] ? scopedPartitionParts[1] : 'PUBLIC';
   return {scope, partition, keyID, cacheID};
 }

 export const getParamsFromURL = (url: string) => {
   if (!url || !isValidURL(url)) {
     throw new InvalidURLError(url);
   }

   const [path, queryString] = url.replace(/^lsw:\/\//i, '').split('?');
   const {scope, partition, keyID, cacheID} = getLswPathComponents(path);
   // TODO: maybe parse this with qs library?
   // const queryParams = !queryString ? {} : queryString.split('&')
   //                                                    .map(x => x.split('='))
   //                                                    .reduce((acc: any, [k,v]) => (acc[k] = v, acc), {});
   const queryParams = qs.parse(queryString, {plainObjects: true});
   const r = {
     query: {
       scope,
       partition,
       keyID,
       id: cacheID
     }
   };
   Object.assign(r.query, queryParams);

   return r;
 }

export const getErrorInfo = (error: errors.FeathersError) => {
  const r: any = error.toJSON ? error.toJSON() : {
    code: error.code ? error.code : 500,
    message: error.message
  };
  r.stack = error.stack;
  Object.assign(r, error);
  delete r.hook;
  return r;
}

 /*
  * Crypto utilities
  */
export const generateGUID = (): string => {
  return uuid().toUpperCase();
}

export const PEMtoDER = (pem: string): Uint8Array => {
  const pemBase64 = pem.replace(/-{5}(\w|\s)*-{5}/g, '').trim();
  const r = naclUtil.decodeBase64(pemBase64);
  return r;
}

export const DERtoPEM = (der: Uint8Array): string => {
  const derB64 = naclUtil.encodeBase64(der);
  const r = `-----BEGIN KEY-----${derB64}-----END KEY-----`;
  return r;
}

export const isPEM = (pem: string): boolean => {
  try {
    PEMtoDER(pem);
  }
  catch (e) {
    return false;
  }
  return true;
}

export const serializeData = (data: any): Uint8Array => {
  let r: any = (typeof data == 'string') ? data : JSON.stringify(data);
  r = naclUtil.decodeUTF8(r);
  return r;
}

export const deserializeData = (data: Uint8Array): any => {
  let r: any = naclUtil.encodeUTF8(data);
  try {
    r = JSON.parse(r);
  } catch (e) {}
  return r;
}

export const hashData = (data: any): string => {
  const message = (data instanceof Uint8Array) ? data : serializeData(data);
  let r: any = nacl.hash(message);
  r = arrayBufferToHex(r.buffer).toUpperCase();
  return r;
}

export const signCacheEnvelopeSection = (cacheID: string, publicKeyID: string, sectionData: any, signingKeyPEM: string): string => {
  const message = serializeData({
    cacheID,
    publicKeyID,
    sectionData
  });
  const signingKeyDER = PEMtoDER(signingKeyPEM);
  let r: any = nacl.sign.detached(message, signingKeyDER);
  r = arrayBufferToHex(r.buffer).toUpperCase();
  return r;
}

export const verifyCacheEnvelopeSection = (cacheID: string, publicKeyID: string, sectionData: any, validationKeyPEM: string,
                                           signature: string): boolean => {
  const message = serializeData({
    cacheID,
    publicKeyID,
    sectionData
  });
  const signatureArrayBuffer = hexToArrayBuffer(signature);
  const signatureUint8Array = new Uint8Array(signatureArrayBuffer);
  const validationKeyDER = PEMtoDER(validationKeyPEM);
  const r = nacl.sign.detached.verify(message, signatureUint8Array, validationKeyDER);
  return r;
}

export const signJWT = (token: string, signingKeyPEM: string): string => {
  const [headerB64, payloadB64] = token.split('.');
  const message = serializeData(`${headerB64}.${payloadB64}`);
  const signingKeyDER = PEMtoDER(signingKeyPEM);
  const signature = nacl.sign.detached(message, signingKeyDER);
  const signatureB64 = naclUtil.encodeBase64(signature);
  const r = `${headerB64}.${payloadB64}.${signatureB64}`;
  return r;
}

export const verifyJWT = (token: string, validationKeyPEM: string): any => {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const message = serializeData(`${headerB64}.${payloadB64}`);
  const signature = naclUtil.decodeBase64(signatureB64);
  const validationKeyDER = PEMtoDER(validationKeyPEM);
  const r = nacl.sign.detached.verify(message, signature, validationKeyDER);
  return r;
}

export const makeJWT = (header: any, payload: any): string => {
  const headerB64 = naclUtil.encodeBase64(serializeData(header));
  const payloadB64 = naclUtil.encodeBase64(serializeData(payload));
  const r = `${headerB64}.${payloadB64}`;
  return r;
}

export const decodeJWT = (token: string): any => {
  const [headerB64, payloadB64] = token.split('.');
  const header = deserializeData(naclUtil.decodeBase64(headerB64));
  const payload = deserializeData(naclUtil.decodeBase64(payloadB64));
  const r = {header, payload};
  return r;
}

export const getPublicKeyFromSecretKey = (secretKeyPEM: string): any => {
  const secretKeyDER = PEMtoDER(secretKeyPEM);
  const publicKeyDER = nacl.sign.keyPair.fromSecretKey(secretKeyDER).publicKey;
  const r = DERtoPEM(publicKeyDER);
  return r;
}

/*
 * JSON Schema utilities
 */
 //@ts-ignore
 const parser = new AJV({verbose: true, jsonPointers: true, schemas: dataSchemas, coerceTypes: true, removeAdditional: true});
 const validator = new AJV({verbose: true, jsonPointers: true, schemas: dataSchemas});

 function _validateData(ajv: any, data: any, schemaID: string, throwError: boolean = false) {
   const validate = ajv.getSchema(schemaID);
   const result = validate(data);
   if (!result) {
     if (throwError) {
       const error = validate.errors.pop();
       const dataPath = error.dataPath;
       const schema = error.schema;
       const schemaPath = error.schemaPath;
       const keyword = error.keyword;
       const keywordParams = error.params;
       throw new ValidationError(data, dataPath, schema, schemaPath, keyword, keywordParams);
     }
     return false;
   }
   return true;
 }

 export function parseData(data: any, schemaID: string, throwError: boolean = true) {
   return _validateData(parser, data, schemaID, throwError);
 }

 export function validateData(data: any, schemaID: string, throwError: boolean = false) {
   return _validateData(validator, data, schemaID, throwError);
 }

 export function validatorHasSchema(schemaID: string) {
   return !!(validator.getSchema(schemaID));
 }

 export function validatorAddSchema(schema: any, schemaID: string) {
   return validator.addSchema(schema, schemaID);
 }

 class ValidationError extends Error {
   public data: any;
   public dataPath: any;
   public schema: any;
   public schemaPath: any;
   public keyword: string;
   public keywordParams: any;

   constructor(data: any, dataPath: string, schema: any, schemaPath: string, keyword: string, keywordParams: any) {
     super('Data does not match schema!');

     // restore prototype chain
     const actualProto = new.target.prototype;
     if (Object.setPrototypeOf) { Object.setPrototypeOf(this, actualProto); }
     else { (this as any).__proto__ = actualProto; }

     // set details
     Object.assign(this, {data, dataPath, schema, schemaPath, keyword, keywordParams});
   }
 }
