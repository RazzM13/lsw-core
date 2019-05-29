import {BackendFactory, filterBackendParams} from './service.cache.store.base';
import BaseCacheStoreService from './service.cache.store.base';
import * as feathers from '@feathersjs/feathers';

// export const determineGeohashAscendents = (geohash: string, minDepth: number = 1, maxDepth: number = 10) => {
//   const r: string[] = [];
//
//   // apply constraints
//   maxDepth = (geohash.length > maxDepth) ? maxDepth : geohash.length;
//
//   // inverse the geohash
//   geohash = geohash.split('').reverse().join('');
//
//   // walk the inversed tree towards the root
//   let parent: string;
//   while (geohash.length > 1) {
//     geohash = geohash.substring(minDepth-1, maxDepth--);
//     parent = geohash.split('').reverse().join('');
//     r.push(parent);
//   }
//
//   return r;
// }
//
// export const determineGeohashDescendents = (geohash: string, minDepth: number = 1, maxDepth: number = 10) => {
//   const r: string[] = [];
//
//   // apply constraints
//   geohash = geohash.substring(0, minDepth);
//
//   // resolve local descedents
//   const descedentSuffixes = '23456789bBCdDFgGhHjJKlLMnNPqQrRtTVWX'.split('');
//   const descedents = descedentSuffixes.map( (x) => (`${geohash}${x}`) );
//   descedents.forEach( (x) => (r.push(x)) );
//
//   // recursively resolve sub-descedents
//   if (minDepth < maxDepth-1) {
//     for (const descedent of descedents) {
//       const subDescedents = determineGeohashDescendents(descedent, descedent.length, maxDepth);
//       subDescedents.forEach( (x) => (r.push(x)) );
//     }
//   }
//
//   return r;
// }

const GeoCacheStoreService = class extends BaseCacheStoreService {

  constructor(scope: string, partition: string, backendFactory: BackendFactory) {
    super(scope, partition, backendFactory);
    this._allowedSchemas = [];
  }

}

export default GeoCacheStoreService;
