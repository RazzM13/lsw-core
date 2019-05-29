import {BackendFactory} from './service.cache.store.base';
import BaseCacheStoreService from './service.cache.store.base';
import * as feathers from '@feathersjs/feathers';

const SchemaCacheStoreService = class extends BaseCacheStoreService {

  constructor(scope: string, partition: string, backendFactory: BackendFactory) {
    super(scope, partition, backendFactory);
    this._allowedSchemas = [
      /^lsw:\/\/schemas@LSW\/\w+\/SchemaCacheSchema$/
    ];
  }

}

export default SchemaCacheStoreService;
