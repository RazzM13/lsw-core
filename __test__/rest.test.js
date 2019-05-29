const app = require('../out/index').default;

const Request = require('supertest');

describe('REST', () => {

  describe('CacheService', () => {

    const request = new Request(app);

    it('should be able to parse an URL that references a specific partition', async () => {
      const result = await request.get("/mockPartition").expect(200);
      expect(result).toMatchObject({
        status: 200
      });
    });

    it('should be able to parse an URL that references a specific partition, userID and cacheID', async () => {
      const result = await request.get("/mockPartition/mockUserID/mockCacheID").expect(200);
      expect(result).toMatchObject({
        status: 200
      });
    });

  });

});
