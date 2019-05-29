const Memory = require('feathers-memory');
const Feathers = require('@feathersjs/feathers');
const CacheStoreBuilder = require('../out/builder.cache.store').default;
const ServiceMock = require('./utils').ServiceMock;

describe('Services', () => {

  describe('AppCacheStoreService', () => {
    let app, service, backend, backendFactory;

    beforeEach(() => {
      backend = new ServiceMock('mockBackendService');
      backendFactory = jest.fn();
      backendFactory.mockReturnValue(backend);
      app = Feathers();
      app.use('SUT', CacheStoreBuilder.AppCacheStoreService().withBackend(backendFactory).build());
      service = app.service('SUT');
    });

    it('has a valid "Partition" property value', async () => {
      expect(service.Partition).toBe('APPS');
    });

    it('has a valid "AllowedSchemas" property value', async () => {
      expect(service.AllowedSchemas).toMatchObject(['//schemas/LSW/AppCache']);
    });

    // it('proxies FIND requests to the backend', async () => {
    //   backend.find.mockResolvedValue(null);
    //   const result = await service.find({
    //
    //   });
    //
    //   // check backend production
    //   expect(backendFactory.mock.calls.length).toBe(1);            // no. of calls
    //   expect(backendFactory.mock.calls[0].length).toBe(1);         // no. of call args
    //   expect(backendFactory.mock.calls[0][0]).toMatchObject({
    //
    //   });                                                          // call "params" arg
    //
    // });


  });

  describe('KeyCacheStoreService', () => {
    let app, service, backend, backendFactory;

    beforeEach(() => {
      backend = new ServiceMock('mockBackendService');
      backendFactory = jest.fn();
      backendFactory.mockReturnValue(backend);
      app = Feathers();
      app.use('SUT', CacheStoreBuilder.KeyCacheStoreService().withBackend(backendFactory).build());
      service = app.service('SUT');
    });

    it('has a valid "Partition" property value', async () => {
      expect(service.Partition).toBe('KEYS');
    });

    it('has a valid "AllowedSchemas" property value', async () => {
      expect(service.AllowedSchemas).toMatchObject(['//schemas/LSW/KeyCache']);
    });

  });

  describe('PatchCacheStoreService', () => {
    let app, service, backend, backendFactory;

    beforeEach(() => {
      backend = new ServiceMock('mockBackendService');
      backendFactory = jest.fn();
      backendFactory.mockReturnValue(backend);
      app = Feathers();
      app.use('SUT', CacheStoreBuilder.PatchCacheStoreService().withBackend(backendFactory).build());
      service = app.service('SUT');
    });

    it('has a valid "Partition" property value', async () => {
      expect(service.Partition).toBe('PATCHES');
    });

    it('has a valid "AllowedSchemas" property value', async () => {
      expect(service.AllowedSchemas).toMatchObject(['//schemas/LSW/PatchCache']);
    });

  });

  describe('SchemaCacheStoreService', () => {
    let app, service, backend, backendFactory;

    beforeEach(() => {
      backend = new ServiceMock('mockBackendService');
      backendFactory = jest.fn();
      backendFactory.mockReturnValue(backend);
      app = Feathers();
      app.use('SUT', CacheStoreBuilder.SchemaCacheStoreService().withBackend(backendFactory).build());
      service = app.service('SUT');
    });

    it('has a valid "Partition" property value', async () => {
      expect(service.Partition).toBe('SCHEMAS');
    });

    it('has a valid "AllowedSchemas" property value', async () => {
      expect(service.AllowedSchemas).toMatchObject(['//schemas/LSW/SchemaCache']);
    });

  });

  describe('GlobalCacheStoreService', () => {
    let app, service, backend, backendFactory;

    beforeEach(() => {
      backend = new ServiceMock('mockBackendService');
      backendFactory = jest.fn();
      backendFactory.mockReturnValue(backend);
      app = Feathers();
      app.use('SUT', CacheStoreBuilder.GlobalCacheStoreService().withBackend(backendFactory).build());
      service = app.service('SUT');
    });

    it('has a valid "Partition" property value', async () => {
      expect(service.Partition).toBe('GLOBALS');
    });

    it('has a valid "AllowedSchemas" property value', async () => {
      expect(service.AllowedSchemas).toMatchObject([]);
    });

  });

  describe('GeoCacheStoreService', () => {
    let app, service, backend, backendFactory;

    beforeEach(() => {
      backend = new ServiceMock('mockBackendService');
      backendFactory = jest.fn();
      backendFactory.mockReturnValue(backend);
      app = Feathers();
      app.use('SUT', CacheStoreBuilder.GeoCacheStoreService().withBackend(backendFactory).build());
      service = app.service('SUT');
    });

    it('has a valid "Partition" property value', async () => {
      expect(service.Partition).toBe('');
    });

    it('has a valid "AllowedSchemas" property value', async () => {
      expect(service.AllowedSchemas).toMatchObject([]);
    });

  });


});
