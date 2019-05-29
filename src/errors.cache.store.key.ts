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

export class InvalidSibling extends BaseCachestoreLayerError {
  constructor(data?: any) {
    const msg = 'The keyCache\'s sibling is invalid.';
    const code = 502;
    super(msg, code, data);
  }
}
