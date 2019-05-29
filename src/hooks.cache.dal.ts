import * as schemaTypes from './schemaTypes';
import * as feathers from '@feathersjs/feathers';
import * as errors from './errors.cache.dal';
import * as cachestoreErrors from './errors.cache.store.base';
import * as utils from './utils';

export default class CacheDalHooks {

  protected static async processParams(context: feathers.HookContext) {
    const {method, params} = context;

    /**
     * Validate request method and required params
     */

    // validate params
    try {
      utils.parseData(params, 'DalParams');
    }
    catch(e) {
      throw new errors.InvalidParams({source: e});
    }

    /**
     * Normalize params
     */

    let {scope, partition} = params.query;
    scope = scope ? scope.toUpperCase() : null;
    partition = partition ? partition : null;
    Object.assign(params.query, {scope, partition});
    
    return context;
  }

  public static make(): Partial<feathers.HooksObject> {
    const hooks = this;
    return Object.freeze(utils.patchHooksThis({
      before: {
        all: [ utils.TagRequest('DAL'), utils.logRequest ]
      },
      error: {
        all: [ utils.WrapLayerErrors(errors.BaseDalError, errors.GeneralError), utils.logError, utils.sanitizeError ]
      }
    }, hooks));
  }

}
