import * as schemaTypes from './schemaTypes';
import * as feathers from '@feathersjs/feathers';
import * as errors from './errors.auth';
import * as utils from './utils';
import * as _ from 'lodash';


export default class AuthHooks {

  protected static async processData(context: feathers.HookContext) {
    const {app, method, data} = context;
    const options = app.get('auth');
    let {sub, exp, nbf, aud = {}} = data;

    /*
     * validate data
     */
    try {
      utils.parseData(data, 'AccessRequest');
    }
    catch(e) {
      throw new errors.InvalidData({source: e});
    }

    // ensure sub is a PEM-encoded key
    if ( !sub || !utils.isPEM(sub) ) {
      throw new errors.InvalidData({input: data, subject: '#/sub'});
    }

    /*
     *  check desired permissions
     */
     const validPermissions = options.lsw.permissions;
     const clockSkewTolerance = options.lsw.clockSkewTolerance;
     const subID = utils.hashData(sub);


     // check access permissions
     const vpAccessDefault = validPermissions.access['default'];
     let vpAccess = validPermissions.access[subID] ? validPermissions.access[subID] : vpAccessDefault;
     vpAccess = _.defaultsDeep({}, vpAccess, vpAccessDefault);

     const audAccess = aud.access;
     if (audAccess) {
       // check each path
       for (const path in audAccess) {
        const aaPath = audAccess[path];
        const {scope, partition, keyID, cacheID} = utils.getLswPathComponents(path);
        const _scope     = `@${scope}/`;
        const _partition = `${partition}@${scope}/`;
        const _keyID     = `${partition}@${scope}/${keyID}`;
        const _cacheID   = `${partition}@${scope}/${keyID}/${cacheID}`;
        const vpaPathScope = vpAccess[_scope] ? vpAccess[_scope] : [];
        const vpaPathPartition = vpAccess[_partition] ? vpAccess[_partition] : [];
        const vpaPathKeyID = vpAccess[_keyID] ? vpAccess[_keyID] : [];
        const vpaPathCacheID = vpAccess[_cacheID] ? vpAccess[_cacheID] : [];

        // determine available permissions
        let vpaPath: string[];
        if (vpaPathCacheID.length) {
          vpaPath = vpaPathCacheID;
        }
        else if (vpaPathKeyID.length) {
          vpaPath = vpaPathKeyID;
        }
        else if (vpaPathPartition.length) {
          vpaPath = vpaPathPartition;
        }
        else {
          vpaPath = vpaPathScope;
        }

        // evaluate required permissions
        if (_.difference(aaPath, vpaPath).length) {
          throw new errors.ConflictOfInterest({input: data, subject: `#/aud/access/${path}`, expected: vpAccess});
        }
       }
     }

     // check request permissions
     const vpRequestDefault = validPermissions.request['default'];
     let vpRequest = validPermissions.request[subID] ? validPermissions.request[subID] : vpRequestDefault;
     vpRequest = _.defaultsDeep({}, vpRequest, vpRequestDefault);

     const audRequest = aud.request;
     if (audRequest) {
       // maxConcurrency
       if (audRequest.maxConcurrency > vpRequest.maxConcurrency) {
         throw new errors.ConflictOfInterest({input: data, subject: '#/aud/request/maxConcurrency', expected: vpRequest});
       }

       // maxExecutionTime
       if (audRequest.maxExecutionTime > vpRequest.maxExecutionTime) {
         throw new errors.ConflictOfInterest({input: data, subject: '#/aud/request/maxExecutionTime', expected: vpRequest});
       }
     }

     // check query permissions
     const vpQueryDefault = validPermissions.query['default'];
     let vpQuery = validPermissions.query[subID] ? validPermissions.query[subID] : vpQueryDefault;
     vpQuery = _.defaultsDeep({}, vpQuery, vpQueryDefault);

     const audQuery = aud.query;
     if (audQuery) {
       // maxLifetime
       if (audQuery.maxLifetime > vpQuery.maxLifetime) {
         throw new errors.ConflictOfInterest({input: data, subject: '#/aud/query/maxLifetime', expected: vpQuery});
       }

       // maxPriority
       if (audQuery.maxPriority > vpQuery.maxPriority) {
         throw new errors.ConflictOfInterest({input: data, subject: '#/aud/query/maxPriority', expected: vpQuery});
       }

       // maxConcurrency
       if (audQuery.maxConcurrency > vpQuery.maxConcurrency) {
         throw new errors.ConflictOfInterest({input: data, subject: '#/aud/query/maxConcurrency', expected: vpQuery});
       }
     }

     // check token permissions
     const vpTokenDefault = validPermissions.token['default'];
     let vpToken = validPermissions.token[subID] ? validPermissions.token[subID] : vpTokenDefault;
     vpToken = _.defaultsDeep({}, vpToken, vpTokenDefault);

     // normalize timestrings to timestamps
     const now = Date.now();

     // normalize requested exp
     if (typeof exp == 'string') {
       exp = utils.getTimestampFromTimestring(exp, now); console.log('expfromts', exp, now);
     }

     // normalize permitted exp
     if (typeof vpToken.exp.min == 'string') {
       vpToken.exp.min = utils.getTimestampFromTimestring(vpToken.exp.min, now);
     }
     if (typeof vpToken.exp.max == 'string') {
       vpToken.exp.max = utils.getTimestampFromTimestring(vpToken.exp.max, now); console.log('expMax', vpToken.exp.max, now);
     }
     if (typeof vpToken.exp.default == 'string') {
       vpToken.exp.default = utils.getTimestampFromTimestring(vpToken.exp.default, now);
     }

     // normalize permitted nbf
     if (typeof vpToken.nbf.min == 'string') {
       vpToken.nbf.min = utils.getTimestampFromTimestring(vpToken.nbf.min, now);
     }
     if (typeof vpToken.nbf.max == 'string') {
       vpToken.nbf.max = utils.getTimestampFromTimestring(vpToken.nbf.max, now);
     }
     if (typeof vpToken.nbf.default == 'string') {
       vpToken.nbf.default = utils.getTimestampFromTimestring(vpToken.nbf.default, now);
     }

      // check if requested exp is within permitted limits
     exp = exp ? exp : vpToken.exp.default;
     const expMin = vpToken.exp.min - clockSkewTolerance;
     const expMax = vpToken.exp.max + clockSkewTolerance;
     if ((exp < expMin) || (exp > expMax)) {
       throw new errors.ConflictOfInterest({input: data, subject: '#/aud/token/exp', expected: vpToken});
     }

     // check if requested nbf is within limits
     nbf = nbf ? nbf : vpToken.nbf.default;
     const nbfMin = vpToken.nbf.min - clockSkewTolerance;
     const nbfMax = vpToken.nbf.max + clockSkewTolerance;
     if ((nbf < nbfMin) || (nbf > nbfMax)) {
       throw new errors.ConflictOfInterest({input: data, subject: '#/aud/token/nbf', expected: vpToken});
     }

    /*
     * augment data
     */
     _.assign(data, {
       exp: exp,
       nbf: nbf,
       iss: utils.getPublicKeyFromSecretKey(options.secret),
       iat: now,
       jti: utils.generateGUID()
     });
     _.defaults(data, {
       aud: {}
     });
     _.defaults(data.aud, {
       access: vpAccess,
       request: vpRequest,
       query: vpQuery
     });

     // prettify output
     context.data = {
      iss: data.iss,
      sub: data.sub,
      aud: data.aud,
      exp: data.exp,
      nbf: data.nbf,
      iat: data.iat,
      jti: data.jti
    };

    return context;
  }

  protected static async processParams(context: feathers.HookContext) {
    const {app, params} = context;
    const options = app.get('auth');

    // augment params
    params.header = {
      typ: 'access',
      alg: 'EdS512'
    };
    params.secretKey = options.lsw.secretKey;

    return context;
  }

  public static make(): Partial<feathers.HooksObject> {
    const hooks = this;
    return Object.freeze(utils.patchHooksThis({
      before: {
        all: [ utils.TagRequest('Authentication'), utils.logRequest ],
        create: [ this.processParams, this.processData ]
      },
      error: {
        all: [ utils.WrapLayerErrors(errors.BaseAuthError, errors.GeneralError), utils.logError, utils.sanitizeError ]
      }
    }, hooks));
  }

}
