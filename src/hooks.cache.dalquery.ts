import * as schemaTypes from './schemaTypes';
import * as feathers from '@feathersjs/feathers';
import * as errors from './errors.cache.dalquery';
import * as utils from './utils';

export default class CacheDalQueryHooks {

  protected static async processParams(context: feathers.HookContext) {
    const {method, service, data: query} = context;

    // validate query method
    if (method != 'create') {
      throw new errors.InvalidMethod({input: method});
    }

    // validate query format
    if (!Array.isArray(query)) {
      throw new errors.InvalidQuery({input: query});
    }

    // validate query data
    for (const queryItem of query) {
      const qiOp = queryItem.op;

      // determine queryItem type
      let qiType;
      switch(qiOp) {
        case 'find':
          qiType = 'DalQueryFindQueryItem';
          break;
        case 'get':
          qiType = 'DalQueryGetQueryItem';
        break;
        case 'create':
          qiType = 'DalQueryCreateQueryItem';
        break;
        case 'update':
          qiType = 'DalQueryUpdateQueryItem';
        break;
        case 'patch':
          qiType = 'DalQueryPatchQueryItem';
          break;
        case 'remove':
          qiType = 'DalQueryRemoveQueryItem';
          break;
        default:
          throw new errors.InvalidQueryItem({input: queryItem, source: Error('Invalid method!')});
      }

      // validate queryItem data
      try {
        utils.validateData(queryItem, qiType, true);
        utils.parseData(queryItem, qiType);
      }
      catch (e) {
        throw new errors.InvalidQueryItem({input: queryItem, source: e});
      }
    }

    return context;
  }

  public static make(): Partial<feathers.HooksObject> {
    const hooks = this;
    return Object.freeze(utils.patchHooksThis({
      before: {
        all: [ utils.TagRequest('DalQuery'), utils.logRequest, hooks.processParams ]
      },
      error: {
        all: [ utils.WrapLayerErrors(errors.BaseDalQueryError, errors.GeneralError), utils.logError, utils.sanitizeError ]
      }
    }, hooks));
  }

}
