const Memory = require('feathers-memory');
const Feathers = require('@feathersjs/feathers');
const CacheDALHook = require('../out/hook.cache.dal').default;
const ServiceMock = require('utils').ServiceMock;

describe('Hooks', () => {

  describe('CacheDALHook', () => {
    let app;
    let mockService;
    let mockPublicKeysService, mockPrivateKeysService;

    beforeEach(() => {
      mockService = new ServiceMock('mockService');
      mockPrivateKeysService = new ServiceMock('mockPrivateKeysService');
      mockPublicKeysService = new ServiceMock('mockPublicKeysService');
      mockGlobalsService = new ServiceMock('mockGlobalsService');
      app = Feathers();
      app.set('backendServices', {
        'cacheDatastores': {
          'keys': mockPublicKeysService,
          'privateKeys': mockPrivateKeysService,
          'globals': mockGlobalsService
        }
      });
      app.use('/:partition', mockService);
      app.service('/:partition').hooks(CacheDALHook);
      app.use('/:partition/:keyID/:cacheID', mockService);
      app.service('/:partition/:keyID/:cacheID').hooks(CacheDALHook);
    });

    it('should be able to parse a request URL that references a partition', async () => {
      mockService.find.mockResolvedValue(null);
      const result = await app.service('/:partition').find({
        partition: 'globals'
      });
      expect(result).toBeNull();
      expect(mockService.find.mock.calls).toHaveLength(1);
      expect(mockService.find.mock.calls[0]).toHaveLength(1);
      expect(mockService.find.mock.calls[0][0]).toMatchObject({
        partition: 'globals',
        datastore: {
          __TEST_ID__: 'mockGlobalsService'
        }
      });
    });

    it('should NOT be able to parse a request URL that references a partition, without specifying the partition', async () => {
      mockService.find.mockResolvedValue(null);
      await expect(app.service('/:partition').find({})).rejects.toThrow(TypeError('Invalid partition'));
    });

    it('should be able to parse a request URL that references a partition, keyID and cacheID', async () => {
      const mockKeyCache = {
        key: 'someKeyValue'
      };
      mockService.get.mockResolvedValue(null);
      mockPrivateKeysService.get.mockRejectedValue('false');
      mockPublicKeysService.get.mockResolvedValue(mockKeyCache);

      // verify method call
      const result = await app.service('/:partition/:keyID/:cacheID').get(0, {
        partition: 'globals',
        keyID: 'someKeyID',
        cacheID: 'someCacheID'
      });
      expect(result).toBeNull();

      // verify mockService
      expect(mockService.get.mock.calls).toHaveLength(1);
      expect(mockService.get.mock.calls[0]).toHaveLength(2);
      expect(mockService.get.mock.calls[0][0]).toBe('someCacheID');
      expect(mockService.get.mock.calls[0][1]).toMatchObject({
        partition: 'globals',
        datastore: {
          __TEST_ID__: 'mockGlobalsService'
        },
        key: mockKeyCache['key'],
        keyID: 'someKeyID',
        cacheID: 'someCacheID'
      });

      // verify mockPublicKeysService
      expect(mockPublicKeysService.get.mock.calls).toHaveLength(1);
      expect(mockPublicKeysService.get.mock.calls[0]).toHaveLength(2);
      expect(mockPublicKeysService.get.mock.calls[0][0]).toBe('someKeyID');
      expect(mockPublicKeysService.get.mock.calls[0][1]).toMatchObject({
        keyID: 'someKeyID',
        cacheID: 'someKeyID'
      });

    });

    it('should NOT be able to parse a request URL that references a partition, keyID and cacheID, without specifying the partition', async () => {
      const mockKeyCache = {
        key: 'someKeyValue'
      };
      mockService.get.mockResolvedValue(null);
      mockPrivateKeysService.get.mockRejectedValue('false');
      mockPublicKeysService.get.mockResolvedValue(mockKeyCache);

      await expect(app.service('/:partition/:keyID/:cacheID').get(0, {
        keyID: 'someKeyID',
        cacheID: 'someCacheID'
      })).rejects.toThrow(TypeError('Invalid partition'));
    });

    it('should NOT be able to parse a request URL that references a partition, keyID and cacheID, without specifying the keyID', async () => {
      const mockKeyCache = {
        key: 'someKeyValue'
      };
      mockService.get.mockResolvedValue(null);
      mockPrivateKeysService.get.mockRejectedValue('false');
      mockPublicKeysService.get.mockResolvedValue(mockKeyCache);

      await expect(app.service('/:partition/:keyID/:cacheID').get(0, {
        partition: 'globals',
        cacheID: 'someCacheID'
      })).rejects.toThrow(TypeError('Invalid keyID'));
    });

    it('should NOT be able to parse a request URL that references a partition, keyID and cacheID, without specifying the cacheID', async () => {
      const mockKeyCache = {
        key: 'someKeyValue'
      };
      mockService.get.mockResolvedValue(null);
      mockPrivateKeysService.get.mockRejectedValue('false');
      mockPublicKeysService.get.mockResolvedValue(mockKeyCache);

      await expect(app.service('/:partition/:keyID/:cacheID').get(0, {
        partition: 'globals',
        keyID: 'someKeyID'
      })).rejects.toThrow(TypeError('Invalid cacheID'));
    });


  });

});
