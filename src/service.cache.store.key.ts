import {BackendFactory} from './service.cache.store.base';
import BaseCacheStoreService from './service.cache.store.base';
import * as feathers from '@feathersjs/feathers';

const KeyCacheStoreService = class extends BaseCacheStoreService {

  constructor(scope: string, partition: string, backendFactory: BackendFactory) {
    super(scope, partition, backendFactory);
    this._allowedSchemas = [
      /^lsw:\/\/schemas@LSW\/\w+\/SecretKeyCacheSchema$/,
      /^lsw:\/\/schemas@LSW\/\w+\/PublicKeyCacheSchema$/
    ];
  }

}

export default KeyCacheStoreService;
