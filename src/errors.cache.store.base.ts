import * as feathers from '@feathersjs/feathers';
import {BaseLayerError} from './errors';


export class BaseCachestoreLayerError extends BaseLayerError {
  constructor(msg: string, code: number, data?: any) {
    const layer = 'Cachestore';
    super(layer, msg, code, data);
  }
}

export class GeneralError extends BaseCachestoreLayerError {
  constructor(requestID: string, data?: any) {
    const msg = `Unable to process request ${requestID}.`;
    const code = 500;
    super(msg, code, data);
  }
}

export class InvalidParams extends BaseCachestoreLayerError {
  constructor(data?: any) {
    const msg = 'Request parameters are missing or are not formatted correctly.';
    const code = 400;
    super(msg, code, data);
  }
}

export class InvalidMethod extends BaseCachestoreLayerError {
  constructor(data?: any) {
    const msg = 'Request made using an invalid method.';
    const code = 405;
    super(msg, code, data);
  }
}

export class InvalidCache extends BaseCachestoreLayerError {
  constructor(msg: string, data?: any) {
    const code = 400;
    super(msg, code, data);
  }
}

export class InvalidCacheFormat extends InvalidCache {
  constructor(data?: any) {
    const msg = 'Cache has an invalid format.';
    super(msg, data);
  }
}

export class InvalidCacheContents extends InvalidCache {
  constructor(data?: any) {
    const msg = 'Cache contents does not match schema.';
    super(msg, data);
  }
}

export class InvalidCacheMetadataType extends InvalidCache {
  constructor(data?: any) {
    const msg = 'Cache metadata type is invalid for this cachestore.';
    super(msg, data);
  }
}

export class InvalidCacheEnvelopeSectionSignature extends InvalidCache {
  constructor(sectionName: string, data?: any) {
    const msg = `Cache '${sectionName}' has an invalid signature`;
    super(msg, data);
  }
}

export class MismatchedRequestParam extends InvalidCache {
  constructor(paramName: string, data?: any) {
    const msg = `Cache does not comply with request ${paramName} value.`;
    super(msg, data);
  }
}

export class NoSuchSchemaCache extends InvalidCache {
  constructor(data?: any) {
    const msg = 'No such schema cache.';
    super(msg, data);
  }
}

export class NoSuchKeyCache extends InvalidCache {
  constructor(data?: any) {
    const msg = 'No such key cache.';
    super(msg, data);
  }
}

export class NoSuchCache extends BaseCachestoreLayerError {
  constructor(data?: any) {
    const msg = 'No such cache.';
    const code = 404;
    super(msg, code, data);
  }
}

export class DuplicateCache extends BaseCachestoreLayerError {
  constructor(data?: any) {
    const code = 409;
    const msg = 'Cache already exists.';
    super(msg, code, data);
  }
}
