import { Inject, Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  async set(key: string, value: any, ttl?: number) {
    if (ttl) {
      return this.redis.set(key, value, { ex: ttl });
    }
    return this.redis.set(key, value);
  }

  async get<T>(key: string): Promise<T | null> {
    return this.redis.get(key);
  }

  async del(key: string) {
    return this.redis.del(key);
  }

}