import { Module, Global } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { RedisService } from './redis.service';
import {ConfigModule} from "@nestjs/config"

@Global() 
@Module({
    imports :[ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useValue: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}