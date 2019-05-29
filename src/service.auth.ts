import Feathers from '@feathersjs/feathers';
import AuthHooks from './hooks.auth';
import * as schemaTypes from './schemaTypes';
import * as feathers from '@feathersjs/feathers';
import * as errors from './errors.auth';
import * as auth from '@feathersjs/authentication';
import * as utils from './utils';
import * as _ from 'lodash';

const AuthService = class extends auth.service.Service {

  private app: feathers.Application<any>;

  setup(app: feathers.Application<any>) {
    this.app = app;
  }

  async create(data: schemaTypes.AccessResponse, params: feathers.Params): Promise<any> {
    const {header, secretKey: signingKeyPEM, secretKey: signingKeyPEM} = params;
    const DAL = this.app.get('DAL');
    console.log('CREATED!');

    // build the access token
    const token = utils.signJWT(utils.makeJWT(header, data), signingKeyPEM);

    // register the authorization
    const authCache = {
      metadata: {
        type: 'lsw://schemas@LSW/{{pubKeyID}}/AuthCacheSchema',
        title: '',
        description: ''
      },
      contents: {
        token,
        isActive: true
      }
    };

    return DAL.create(authCache, {
      query: {
        scope: 'LSW',
        partition: 'auths',
        keyID: ''
      }
    });
    //
    // return token;
  }

}

function init(options: any) {
  return function() {
    const app = this;
    const path = options.path;

    // register authentication service
    app.use(path, new AuthService(app));
    const service = app.service(path);
    service.hooks(AuthHooks.make());

    if (typeof service.publish === 'function') {
      service.publish(() => false);
    }
  }
}

export default function configure(options: any) {
  // validate options
  try {
    utils.parseData(options, 'AuthInitOptions');
  }
  catch(e) {
    throw new errors.InvalidInitOptions({source: e});
  }

  // apply defaults
  _.defaultsDeep(options, {
    permissions: {
      request: {
        default: {
          maxConcurrency: 1,
          maxExecutionTime: 300,
        },
        keyID: {
          maxConcurrency: 8,
          maxExecutionTime: 300,
        }
      },
      query: {
        default: {
          maxLifetime: 0,
          maxPriority: 100,
          maxConcurrency: 1
        },
        keyID: {
          maxLifetime: 900,
          maxPriority: 10,
          maxConcurrency: 1
        }
      },
      token: {
        default: {
          exp: { min: 'now', max: '+1d', default: '+1d' },
          nbf: { min: 'now', max: '+1d', default: 'now' }
        }
      }
    },
    maxTokensPerSource: 1,
    clockSkewTolerance: 30
  });

  // normalize access permissions
  const access = options.permissions.access;
  for (const routes of Object.values(access) as any) {
    for (const route in routes) {
      // convert boolean value to array of permitted methods
      if (typeof routes[route] == 'boolean') {
        if (routes[route] == false) {
          routes[route] = [];
        }
        else {
          routes[route] = ['find', 'get', 'create', 'update', 'patch', 'remove'];
        }
      }
    }
  }

  return function(app: any) {
    const _options = {
      lsw: options,
      path: '/auth',
      secret: options.secretKey,
      authService: init.bind(app)
    };
    return auth.default(_options).bind(app)();
  };
}
