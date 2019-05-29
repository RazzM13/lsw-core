import * as feathers from '@feathersjs/feathers';
import {BaseLayerError} from './errors';


export class BaseDalError extends BaseLayerError {
  constructor(msg: string, code: number, data?: any) {
    const layer = 'DAL';
    super(layer, msg, code, data);
  }
}

export class GeneralError extends BaseDalError {
  constructor(requestID: string, data?: any) {
    const msg = `Unable to process request ${requestID}.`;
    const code = 500;
    super(msg, code, data);
  }
}

export class InvalidParams extends BaseDalError {
  constructor(data?: any) {
    const msg = 'Request parameters are missing or are not formatted correctly.';
    const code = 400;
    super(msg, code, data);
  }
}

export class InvalidMethod extends BaseDalError {
  constructor(data?: any) {
    const msg = 'Request made using an invalid method.';
    const code = 405;
    super(msg, code, data);
  }
}

export class InvalidService extends BaseDalError {
  constructor(data?: any) {
    const msg = 'Request made to an unregistered service.';
    const code = 400;
    super(msg, code, data);
  }
}
