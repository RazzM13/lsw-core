import * as schemaTypes from './schemaTypes';
import * as feathers from '@feathersjs/feathers';
import * as errors from './errors.cache.dal';
import * as utils from './utils';

const CacheDalQueryService = class implements Partial<feathers.Service<any>> {

  private DAL: any;

  constructor(DAL: any) {
    if (!DAL) {
      throw Error('Invalid DAL service!');
    }
    this.DAL = DAL;
  }

  async create(query: schemaTypes.DalQueryData, params: feathers.Params): Promise<any> {
    let results: any[] = [];

    // trigger subquery execution
    for (const queryItem of query) {
      const qiMethod = queryItem.op;
      const qiID = queryItem.query.id;
      const qiData = (queryItem as any).data;
      const qiParams = {query: queryItem.query};

      let qiMethodArgs;
      let qiMethodStatus;
      switch(qiMethod) {
        case 'find':
          qiMethodArgs = [qiParams];
          qiMethodStatus = 200;
          break;
        case 'get':
          qiMethodArgs = [qiID, qiParams];
          qiMethodStatus = 200;
          break;
        case 'create':
          qiMethodArgs = [qiData, qiParams];
          qiMethodStatus = 201;
          break;
        case 'update':
          qiMethodArgs = [qiID, qiData, qiParams];
          qiMethodStatus = 200;
          break;
        case 'patch':
          qiMethodArgs = [qiID, qiData, qiParams];
          qiMethodStatus = 200;
          break;
        case 'remove':
          qiMethodArgs = [qiID, qiParams];
          qiMethodStatus = 200;
          break;
        default:
          throw Error('Invalid query item method!');
      }

      let qiMethodResult;
      try {
        qiMethodResult = await (this.DAL as any)[qiMethod](...qiMethodArgs);
      }
      catch(e) {
        qiMethodResult = e;
      }

      qiMethodStatus = qiMethodResult.code ? qiMethodResult.code : qiMethodStatus;

      const qiResult = {
        query: queryItem,
        status: qiMethodStatus,
        result: qiMethodResult
      };

      results.push(qiResult);
    }

    return results;
  }

}

export default CacheDalQueryService;
