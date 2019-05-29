import * as feathers from '@feathersjs/feathers';
import * as utils from './utils';
import BaseCacheStoreHooks from './hooks.cache.store.base';
import * as errors from './errors.cache.store.key';
import * as baseStoreErrors from './errors.cache.store.base';


export default class KeyCacheStoreHooks extends BaseCacheStoreHooks {

  protected static _makeCacheID(cache: any) {
    console.log('_makeCacheID', cache['contents']);
    const keyPEM = cache['contents']['key'];
    const keyDER = utils.PEMtoDER(keyPEM);
    const cacheID = utils.hashData(keyDER);
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

  protected static async _makeCacheSectionSignature(cache: any, scope:string, DAL: any, sectionID: string) {
    const {id: cacheID, keyID: publicKeyID} = cache;
    const sectionData = cache[sectionID];

    let signingKeyPEM;
    // this is a PUBLIC KEY thus it's signed by it's sibling
    if (cacheID == publicKeyID) {
      const secretKeyPath = cache['contents']['sibling'];
      const secretKeyURL = `lsw://keys@${scope}/${secretKeyPath}?$noSignatureValidation=true`;

      // acquire sibling
      let secretKeyCache;
      try {
        secretKeyCache = await this._getKeyCacheByURL(secretKeyURL, DAL);
      }
      catch (e) {
        throw new errors.InvalidSibling({ input: secretKeyCache, source: e });
      }

      // validate sibling signatures
      const publicKeyPEM = cache['contents']['key'];
      const secretKeyCacheID = secretKeyCache['id'];
      const [secretKeyMetadata, secretKeyMetadataSignature] = [secretKeyCache['metadata'], secretKeyCache['metadataSignature']];
      const [secretKeyContents, secretKeyContentsSignature] = [secretKeyCache['contents'], secretKeyCache['contentsSignature']];
      const isSecretKeyMetadataValid = utils.verifyCacheEnvelopeSection(secretKeyCacheID, publicKeyID, secretKeyMetadata,
                                                                        publicKeyPEM, secretKeyMetadataSignature);
      const isSecretKeyContentsValid = utils.verifyCacheEnvelopeSection(secretKeyCacheID, publicKeyID, secretKeyContents,
                                                                        publicKeyPEM, secretKeyContentsSignature);
      if (!isSecretKeyMetadataValid || !isSecretKeyContentsValid) {
        throw new errors.InvalidSibling({ input: secretKeyCache, isMetadataValid: isSecretKeyMetadataValid,
                                                                 isContentsValid: isSecretKeyContentsValid });
      }

      signingKeyPEM = secretKeyCache['contents']['key'];
    }
    // this is a SECRET KEY hence it signs itself
    else {
      signingKeyPEM = cache['contents']['key'];
    }

    // generate and apply signature
    const signature = utils.signCacheEnvelopeSection(cacheID, publicKeyID, sectionData, signingKeyPEM);

    return signature;
  }

  protected static async _isCacheSectionSignatureValid(cache: any, scope:string, DAL: any, sectionID: string) {
    const {id: cacheID, keyID: publicKeyID} = cache;
    const sectionData = cache[sectionID];
    const sectionSignature = cache[`${sectionID}Signature`];

    let validationKeyCache;
    // this is a complete PUBLIC KEY thus it validates itself
    if ( cache['contents'] && (cacheID == publicKeyID) ) {
      validationKeyCache = cache;
    }
    // this is an incomplete PUBLIC KEY thus the full key is required OR
    // this is a SECRET KEY hence it's validated by it's sibling
    else {
      validationKeyCache = await this._getKeyCache(publicKeyID, publicKeyID, scope, DAL);
    }

    const validationKeyPEM = validationKeyCache['contents']['key'];
    return utils.verifyCacheEnvelopeSection(cacheID, publicKeyID, sectionData, validationKeyPEM, sectionSignature);
  }

}
