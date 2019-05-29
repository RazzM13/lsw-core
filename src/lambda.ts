import app from './index';
import * as awsServerlessExpress from 'aws-serverless-express';

const server = awsServerlessExpress.createServer(app);

exports.handler = (event: any, context: any) => { awsServerlessExpress.proxy(server, event, context) }
