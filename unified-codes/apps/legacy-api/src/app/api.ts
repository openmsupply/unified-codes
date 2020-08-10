import fastify from 'fastify';

import schemas from './schemas';
import handlers from './handlers';

import { Api } from './types';

const api: Api = fastify({ logger: true });

api.get('/health', { schema: schemas.health, handler: handlers.health });
api.get('/items', { schema: schemas.items, handler: handlers.items });
api.get('/version', { schema: schemas.version, handler: handlers.version });

export default api;