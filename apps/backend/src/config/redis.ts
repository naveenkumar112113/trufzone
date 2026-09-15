import Redis from 'ioredis';
// @ts-ignore
import RedisMock from 'ioredis-mock';

let redisInstance: any;

try {
  if (process.env.NODE_ENV === 'test' || process.env.USE_REDIS_MOCK === 'true' || !process.env.REDIS_URL) {
    redisInstance = new (RedisMock as any)();
    console.log('Redis: Running in-memory mock (ioredis-mock)');
  } else {
    redisInstance = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't retry endlessly if redis not running
    });
    redisInstance.on('error', (err: any) => {
      console.warn('Redis warning (using fallback mock if offline):', err.message);
    });
  }
} catch (e) {
  console.warn('Falling back to RedisMock due to error:', e);
  redisInstance = new (RedisMock as any)();
}

export default redisInstance;
