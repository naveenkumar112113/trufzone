"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
// @ts-ignore
const ioredis_mock_1 = __importDefault(require("ioredis-mock"));
let redisInstance;
try {
    if (process.env.NODE_ENV === 'test' || process.env.USE_REDIS_MOCK === 'true' || !process.env.REDIS_URL) {
        redisInstance = new ioredis_mock_1.default();
        console.log('Redis: Running in-memory mock (ioredis-mock)');
    }
    else {
        redisInstance = new ioredis_1.default(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            retryStrategy: () => null, // don't retry endlessly if redis not running
        });
        redisInstance.on('error', (err) => {
            console.warn('Redis warning (using fallback mock if offline):', err.message);
        });
    }
}
catch (e) {
    console.warn('Falling back to RedisMock due to error:', e);
    redisInstance = new ioredis_mock_1.default();
}
exports.default = redisInstance;
