import * as feathers from '@feathersjs/feathers';
import {BaseLayerError} from './errors';


export class BaseAuthError extends BaseLayerError {
  constructor(msg: string, code: number, data?: any) {
    const layer = 'Authentication';
    super(layer, msg, code, data);
  }
}

export class GeneralError extends BaseAuthError {
  constructor(requestID: string, data?: any) {
    const msg = `Unable to process request ${requestID}.`;
    const code = 500;
    super(msg, code, data);
  }
}

export class InvalidData extends BaseAuthError {
  constructor(data?: any) {
    const msg = 'Request data is not formatted correctly.';
    const code = 400;
    super(msg, code, data);
  }
}

export class InvalidMethod extends BaseAuthError {
  constructor(data?: any) {
    const msg = 'Request made using an invalid method.';
    const code = 405;
    super(msg, code, data);
  }
}

export class InvalidInitOptions extends BaseAuthError {
  constructor(data?: any) {
    const msg = 'Initialiation options are invalid.';
    const code = 500;
    super(msg, code, data);
  }
}

export class ConflictOfInterest extends BaseAuthError {
  constructor(data?: any) {
    const msg = 'Unable to satisfy client demands.';
    const code = 409;
    super(msg, code, data);
  }
}
