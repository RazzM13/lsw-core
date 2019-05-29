import 'source-map-support/register';
import { Service } from '@feathersjs/feathers';
import feathers from '@feathersjs/feathers';
import express from '@feathersjs/express';
import auth from './service.auth';
import CacheDalService from './service.cache.dal';
import CacheDalQueryService from './service.cache.dalquery';
import CacheDalHooks from './hooks.cache.dal';
import CacheDalQueryHooks from './hooks.cache.dalquery';
import CacheStoreServiceBuilder from './builder.cache.store';
import * as cors from 'cors';
import * as utils from './utils';

const Memory: any = require('feathers-memory');
const LswDataIndex: any = require('./data/cachestore/LSW/index');


/**
 * Setup datastore backends
 */
const backendInstances: any = {};
const backendFactory = (scope: string, partition: string) => {
  let r: any;

  // ensure correct lookup for service partitions
  const servicePartitions = ['APPS', 'KEYS', 'PATCHES', 'SCHEMAS', 'GLOBALS'];
  if (servicePartitions.indexOf(partition.toUpperCase()) != -1) {
    partition = partition.toUpperCase();
  }

  // if the backend has already been instantiated return the existing instance
  const backendInstance = backendInstances[`${partition}@${scope}`];
  if (backendInstance) {
    r = backendInstance;
  }
  // otherwise create a new instance and save it for future use
  else {
    switch (scope) {
      case 'PRIVATE':
        r = new Memory();
        break;
      case 'LSW':
        r = new Memory({store: LswDataIndex[partition]});
        break;
      default:
        r = new Memory();
    }
    backendInstances[`${partition}@${scope}`] = r;
  }

  return r;
};

/**
 * Setup service layer
 */
const app = express(feathers());

// Enable CORS support
app.use(cors());
// Turn on JSON body parsing for REST services
app.use(express.json({ limit: '1mb' }))
// Set up REST transport using Express
app.configure(express.rest());
// Enable peer authentication
app.configure(auth({
  permissions: {
    access: {
      default: {
        '@public/': ['find', 'get']
      },
      keyID: {
        '@public/': true
      }
    }
  },
  maxTokensPerSource: 1,
  clockSkewTolerance: 30,
  keyPair: {
    secretKeyCache: '62b6df144a2a7b65a2ca4be37c779e372b0d5ebdd0edc35a58d2f7d0553d3568c54c431ec84d576bc0678466060f1bf5f19e93d4c994754d2a8adca61383a869/62b6df144a2a7b65a2ca4be37c779e372b0d5ebdd0edc35a58d2f7d0553d3568c54c431ec84d576bc0678466060f1bf5f19e93d4c994754d2a8adca61383a869',
    publicKeyCache: '62b6df144a2a7b65a2ca4be37c779e372b0d5ebdd0edc35a58d2f7d0553d3568c54c431ec84d576bc0678466060f1bf5f19e93d4c994754d2a8adca61383a869/d420e10561067ed78bd706e6b60899b91d8321cd2a038097d26cb2609b23c880594d3e32f996f633987928add46a1a047be0e8d90d8e0827ed0aaa31d2197edd'
  }
}));
// Set up routing and parameters for services
app.use((req, res, next) => {
  const params = {
    query: {}
  };

  // Set up DAL service routing and parameters
  if (/^\/dal/.test(req.originalUrl)) {
    const query = params.query as any;
    const lswURL = req.originalUrl.replace(/^\/dal/, 'lsw:/');
    Object.assign(params, utils.getParamsFromURL(lswURL));

    // req.url = '/dal';
    // if (query.id) {
    //   req.url += `/${query.id}`;
    // }
  }
  // @ts-ignore -- TODO: perhaps report this???
  Object.assign(req.feathers, params);
  next();
});

// Dependecy injection
app.set('DI', {
  'cacheStoreServiceBuilders': {
    'GEOCACHES': CacheStoreServiceBuilder.GeoCacheStoreService().withBackend(backendFactory),
    'TAGCACHES': CacheStoreServiceBuilder.TagCacheStoreService().withBackend(backendFactory),
    'APPS':      CacheStoreServiceBuilder.AppCacheStoreService().withBackend(backendFactory),
    'KEYS':      CacheStoreServiceBuilder.KeyCacheStoreService().withBackend(backendFactory),
    'PATCHES':   CacheStoreServiceBuilder.PatchCacheStoreService().withBackend(backendFactory),
    'SCHEMAS':   CacheStoreServiceBuilder.SchemaCacheStoreService().withBackend(backendFactory),
    'GLOBALS':   CacheStoreServiceBuilder.GlobalCacheStoreService().withBackend(backendFactory),
    'AUTHS':      CacheStoreServiceBuilder.AuthCacheStoreService().withBackend(backendFactory)
  },
  'logger': console
});

// Set up the DAL service
const cacheDalServiceURI = '/dal/:scopedPartition/:keyID?';
app.use(cacheDalServiceURI, new CacheDalService());
const cacheDalService = app.service(cacheDalServiceURI);
cacheDalService.hooks(CacheDalHooks.make());

app.set('DAL', cacheDalService);

// Set up the DAL bulk query service
const cacheDalQueryServiceURI = '/query';
app.use(cacheDalQueryServiceURI, new CacheDalQueryService(cacheDalService));
app.service(cacheDalQueryServiceURI).hooks(CacheDalQueryHooks.make());

// Set up an error handler that gives us nicer errors
app.use(express.errorHandler());

export default app;
