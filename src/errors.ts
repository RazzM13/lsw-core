import * as errors from '@feathersjs/errors';


export class BaseLayerError extends errors.FeathersError {
  readonly layer: string;
  constructor(layer: string, msg: string, code: number = 500, data?: any) {
    const name = `${layer}Error`;
    const className = `${layer.toLowerCase()}-error`;
    super(msg, name, code, className, data);
    this.layer = layer;
  }
}
