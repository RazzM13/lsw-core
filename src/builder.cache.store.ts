import { BackendFactory } from './service.cache.store.base';

import GeoCacheStoreService from './service.cache.store.geo';
import TagCacheStoreService from './service.cache.store.tag';
import AppCacheStoreService from './service.cache.store.app';
import AuthCacheStoreService from './service.cache.store.auth';
import KeyCacheStoreService from './service.cache.store.key';
import PatchCacheStoreService from './service.cache.store.patch';
import SchemaCacheStoreService from './service.cache.store.schema';
import GlobalCacheStoreService from './service.cache.store.global';

import GeoCacheStoreHooks from './hooks.cache.store.geo';
import TagCacheStoreHooks from './hooks.cache.store.tag';
import AppCacheStoreHooks from './hooks.cache.store.app';
import AuthCacheStoreHooks from './hooks.cache.store.auth';
import KeyCacheStoreHooks from './hooks.cache.store.key';
import PatchCacheStoreHooks from './hooks.cache.store.patch';
import SchemaCacheStoreHooks from './hooks.cache.store.schema';
import GlobalCacheStoreHooks from './hooks.cache.store.global';

import * as feathers from '@feathersjs/feathers';


class CacheStoreServiceBuilder {

  private cacheStoreApp:any
  private cacheStoreService:any
  private cacheStoreServiceURI: string
  private cacheStoreServiceClass: any
  private cacheStoreServiceScope: string
  private cacheStoreServicePartition: string
  private cacheStoreServiceBackendFactory: BackendFactory
  private cacheStoreHooks: any
  private cacheStoreHookClass: any

  static GeoCacheStoreService() {
    const builder = new CacheStoreServiceBuilder();
    builder.cacheStoreServiceClass = GeoCacheStoreService;
    builder.cacheStoreHookClass = GeoCacheStoreHooks;
    return builder;
  }

  static TagCacheStoreService() {
    const builder = new CacheStoreServiceBuilder();
    builder.cacheStoreServiceClass = TagCacheStoreService;
    builder.cacheStoreHookClass = TagCacheStoreHooks;
    return builder;
  }

  static AuthCacheStoreService() {
    const builder = new CacheStoreServiceBuilder();
    builder.cacheStoreServiceClass = AuthCacheStoreService;
    builder.cacheStoreHookClass = AuthCacheStoreHooks;
    return builder;
  }

  static AppCacheStoreService() {
    const builder = new CacheStoreServiceBuilder();
    builder.cacheStoreServiceClass = AppCacheStoreService;
    builder.cacheStoreHookClass = AppCacheStoreHooks;
    return builder;
  }

  static KeyCacheStoreService() {
    const builder = new CacheStoreServiceBuilder();
    builder.cacheStoreServiceClass = KeyCacheStoreService;
    builder.cacheStoreHookClass = KeyCacheStoreHooks;
    return builder;
  }

  static PatchCacheStoreService() {
    const builder = new CacheStoreServiceBuilder();
    builder.cacheStoreServiceClass = PatchCacheStoreService;
    builder.cacheStoreHookClass = PatchCacheStoreHooks;
    return builder;
  }

  static SchemaCacheStoreService() {
    const builder = new CacheStoreServiceBuilder();
    builder.cacheStoreServiceClass = SchemaCacheStoreService;
    builder.cacheStoreHookClass = SchemaCacheStoreHooks;
    return builder;
  }

  static GlobalCacheStoreService() {
    const builder = new CacheStoreServiceBuilder();
    builder.cacheStoreServiceClass = GlobalCacheStoreService;
    builder.cacheStoreHookClass = GlobalCacheStoreHooks;
    return builder;
  }

  withApp(app: feathers.Application<any>) {
    this.cacheStoreApp = app;
    return this;
  }

  withScope(scope: string) {
    this.cacheStoreServiceScope = scope;
    return this;
  }

  withPartition(partition: string) {
    this.cacheStoreServicePartition = partition;
    return this;
  }

  withBackend(backendFactory: BackendFactory) {
    this.cacheStoreServiceBackendFactory = backendFactory;
    return this;
  }

  build() {
    this.cacheStoreService = new this.cacheStoreServiceClass(this.cacheStoreServiceScope,
                                                             this.cacheStoreServicePartition,
                                                             this.cacheStoreServiceBackendFactory);
    this.cacheStoreServiceURI = `${this.cacheStoreServicePartition}@${this.cacheStoreServiceScope}`;
    this.cacheStoreHooks = this.cacheStoreHookClass.make();
    this.cacheStoreApp.use(this.cacheStoreServiceURI, this.cacheStoreService);
    this.cacheStoreApp.service(this.cacheStoreServiceURI).hooks(this.cacheStoreHooks);
    return this.cacheStoreApp.service(this.cacheStoreServiceURI);
  }

}

export default CacheStoreServiceBuilder
