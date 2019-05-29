import {BackendFactory, filterBackendParams} from './service.cache.store.base';
import BaseCacheStoreService from './service.cache.store.base';
import * as feathers from '@feathersjs/feathers';

const TagCacheStoreService = class extends BaseCacheStoreService {

  constructor(scope: string, partition: string, backendFactory: BackendFactory) {
    super(scope, partition, backendFactory);
    this._allowedSchemas = [];
  }

}

export default TagCacheStoreService;
