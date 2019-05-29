import * as feathers from '@feathersjs/feathers';
import * as errors from './errors.cache.store.base';


export type BackendFactory = (scope:string, partition: string) => any;

export const filterBackendParams = (params: any) => {
  const query: any = Object.assign({}, params.query);
  delete query['$noSignatureValidation'];
  for (let k in query) {
    // prevent null value
    const v = query[k];
    if (v === null) {
      delete query[k];
    }
  }
  const r = {query};
  return r;
}

const BaseCacheStoreService = class implements Partial<feathers.Service<any>> {

  private _scope: string;
  private _partition: string;
  private _backendFactory: BackendFactory;
  protected _allowedSchemas: RegExp[];

  get scope() {
    return this._scope;
  }

  get partition() {
    return this._partition;
  }

  get allowedSchemas() {
    return this._allowedSchemas;
  }

  constructor(scope: string, partition: string, backendFactory: BackendFactory) {
    switch (true) {
      case !scope:
        throw TypeError(`Invalid scope: "${scope}"`);
      case !partition:
        throw TypeError(`Invalid partition: "${partition}"`);
      case !backendFactory:
        throw TypeError('Invalid factory method!');
    }
    this._scope = scope;
    this._partition = partition;
    this._backendFactory = backendFactory;
  }

  _getStoreBackend() {
    const r = this._backendFactory(this.scope, this.partition);
    if (!r) {
      throw Error('Unable to instantiate store backend!');
    }
    return r;
  }

  async find(params?: feathers.Params) {
    const backendParams = filterBackendParams(params);console.log('findParams', params, backendParams);
    return this._getStoreBackend().find(backendParams);
  };

  async get(id: feathers.Id, params?: feathers.Params) {
    const backendParams = filterBackendParams(params);
    return this._getStoreBackend().get(id, backendParams);
  };

  async create(data: any | any[], params?: feathers.Params) {
    const storeBackend = this._getStoreBackend();
    const backendParams = filterBackendParams(params);
    const cacheExists = (await storeBackend.find({query: {id: data.id}})).length;

    if (cacheExists) {
      throw new errors.DuplicateCache({query: params.query});
    }

    return storeBackend.create(data, backendParams);
  };

  async update(id: feathers.Id, data: any | any[], params?: feathers.Params) {
    const storeBackend = this._getStoreBackend();
    const backendParams = filterBackendParams(params);
    const cacheExists = (await storeBackend.find({query: {id}})).length;

    let result;
    if (!cacheExists) {
      result = storeBackend.create(data, backendParams);
    } else {
      result = storeBackend.update(id, data, backendParams);
    }

    return result;
  };

  // TODO:
  // async patch(id: feathers.Id, data: any | any[], params?: feathers.Params) {
  //   return this._getStoreBackend().patch(id, data, params);
  // };

  async remove(id: feathers.Id, params?: feathers.Params) {
    //
    // return this._getStoreBackend().update(id, data, params);
  };

}

export default BaseCacheStoreService;
