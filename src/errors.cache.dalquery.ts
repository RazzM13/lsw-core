import * as feathers from '@feathersjs/feathers';
import {BaseLayerError} from './errors';


export class BaseDalQueryError extends BaseLayerError {
  constructor(msg: string, code: number, data?: any) {
    const layer = 'DalQuery';
    super(layer, msg, code, data);
  }
}

export class GeneralError extends BaseDalQueryError {
  constructor(requestID: string, data?: any) {
    const msg = `Unable to process request ${requestID}.`;
    const code = 500;
    super(msg, code, data);
  }
}

export class InvalidQuery extends BaseDalQueryError {
  constructor(data?: any) {
    const msg = 'Request query is invalid.';
    const code = 400;
    super(msg, code, data);
  }
}

export class InvalidQueryItem extends BaseDalQueryError {
  constructor(data?: any) {
    const msg = 'Request query item is invalid.';
    const code = 400;
    super(msg, code, data);
  }
}

export class InvalidMethod extends BaseDalQueryError {
  constructor(data?: any) {
    const msg = 'Request made using an invalid method.';
    const code = 405;
    super(msg, code, data);
  }
}
