import Feathers from '@feathersjs/feathers';
import * as feathers from '@feathersjs/feathers';
import * as errors from './errors.cache.dal';
import * as utils from './utils';

const filterCachestoreParams = (params: any) => {
  const query: any = Object.assign({}, params.query);
  delete query['scope'];
  delete query['partition'];
  const r = {query};
  return r;
}

const CacheDalService = class implements Partial<feathers.Service<any>> {

  private DI: any;
  private cacheStoreApp: feathers.Application<any>;

  constructor() {
    this.cacheStoreApp = Feathers();
  }

  setup(app: feathers.Application<any>) {
    this.DI = app.get('DI');
    this.cacheStoreApp.set('DAL', this);
  }

  _getCacheStore(params: feathers.Params) {
    const cacheStoreServiceBuilders: any = this.DI['cacheStoreServiceBuilders'];
    const cacheStorePartitions: string[] = Object.keys(cacheStoreServiceBuilders);
    const {scope, partition} = params.query;

    /*
     * Acquire cache store service builder
     */
    let cacheStoreServiceBuilder: any;

    // this is one of the basic cache services
    const cacheStoreServiceBuilderID = partition.toUpperCase();
    if (!!~(cacheStorePartitions.indexOf(cacheStoreServiceBuilderID))) {
     cacheStoreServiceBuilder = cacheStoreServiceBuilders[cacheStoreServiceBuilderID];
    }
    // this is the geocache service
    else if (utils.isValidGeohash(partition)) {
     cacheStoreServiceBuilder = cacheStoreServiceBuilders['GEOCACHES'];
   }
   // this is the tagcache service
   else if (utils.isValidHashtag(partition)) {
     cacheStoreServiceBuilder = cacheStoreServiceBuilders['TAGCACHES'];
   }
   // invalid service
   else {
      throw new errors.InvalidService({input: partition});
   }

    // initialize a private cache store service
    const cacheStoreService = cacheStoreServiceBuilder.withApp(this.cacheStoreApp)
                                                      .withScope(scope)
                                                      .withPartition(partition)
                                                      .build();
    return cacheStoreService;
  }

  async find(params: feathers.Params): Promise<any> {
    const cachestoreParams = filterCachestoreParams(params);
    return this._getCacheStore(params).find(cachestoreParams);
  }

  async get(id: feathers.Id, params: feathers.Params): Promise<any> {
    const cachestoreParams = filterCachestoreParams(params);
    return this._getCacheStore(params).get(id, cachestoreParams);
  }

  async create(data: any | any[], params: feathers.Params): Promise<any> {
    const cachestoreParams = filterCachestoreParams(params);
    return this._getCacheStore(params).create(data, cachestoreParams);
  }

  async update(id: feathers.Id, data: any | any[], params: feathers.Params): Promise<any> {
    const cachestoreParams = filterCachestoreParams(params);
    return this._getCacheStore(params).update(id, data, cachestoreParams);
  }

  async patch(id: feathers.Id, data: any | any[], params: feathers.Params): Promise<any> {
    const cachestoreParams = filterCachestoreParams(params);
    return this._getCacheStore(params).patch(id, data, cachestoreParams);
  }

  async remove(id: feathers.Id, params: feathers.Params): Promise<any> {
    const cachestoreParams = filterCachestoreParams(params);
    return this._getCacheStore(params).remove(id, cachestoreParams);
  }

  async findByURL(url: string): Promise<any> {
    const params = utils.getParamsFromURL(url);
    return this.find(params);
  }

  async getByURL(url: string): Promise<any> {
    const params = utils.getParamsFromURL(url);
    const {id: cacheID} = params.query;
    return this.get(cacheID, params);
  }

  async createByURL(url: string, data: any | any[]): Promise<any> {
    const params = utils.getParamsFromURL(url);
    return this.create(data, params);
  }

  async updateByURL(url: string, data: any | any[]): Promise<any> {
    const params = utils.getParamsFromURL(url);
    const {id: cacheID} = params.query;
    return this.update(cacheID, data, params);
  }

  async patchByURL(url: string, data: any | any[]): Promise<any> {
    const params = utils.getParamsFromURL(url);
    const {id: cacheID} = params.query;
    return this.patch(cacheID, data, params);
  }

  async removeByURL(url: string): Promise<any> {
    const params = utils.getParamsFromURL(url);
    const {id: cacheID} = params.query;
    return this.remove(cacheID, params);
  }

}

export default CacheDalService;
