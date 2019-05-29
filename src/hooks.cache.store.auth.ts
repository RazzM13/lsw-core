import * as feathers from '@feathersjs/feathers';
import BaseCacheStoreHooks from './hooks.cache.store.base';
import * as baseStoreErrors from './errors.cache.store.base';

export default class AuthCacheStoreHooks extends BaseCacheStoreHooks {

  protected static _makeCacheID(cache: any) {
    const cacheID = cache['contents']['token']['jti'];
    return cacheID;
  }

  protected static async assignCacheID(context: feathers.HookContext) {
    const {service, params, id} = context;
    const {query} = params;
    const {keyID} = query;
    const cache = context.data ? context.data : context.result;

    const cacheID = this._makeCacheID(cache);

    cache.id = cacheID;
    cache.keyID = keyID;
    context.id = cacheID;

    return context;
  }

  protected static async validateCacheID(context: feathers.HookContext) {
    const {service, params, id} = context;
    const {query} = params;
    const {keyID} = query;
    const cache = context.data ? context.data : context.result;
    const {id: cacheID, keyID: cacheKeyID} = cache;

    // detect ID mismatch
    if (cacheID && cache.contents) {
      const realCacheID = this._makeCacheID(cache);
      if (cacheID != realCacheID) {
        throw new baseStoreErrors.MismatchedRequestParam('id', {input: cacheID, expected: realCacheID});
      }
    }

    if ( id && (id != cacheID) ) {
      throw new baseStoreErrors.MismatchedRequestParam('id', {input: cacheID, expected: id});
    }

    if ( keyID && (keyID != cacheKeyID) ) {
      throw new baseStoreErrors.MismatchedRequestParam('keyID', {input: cacheKeyID, expected: keyID});
    }

    return context;
  }

}
