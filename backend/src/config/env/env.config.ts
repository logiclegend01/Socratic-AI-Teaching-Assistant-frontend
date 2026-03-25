import * as Joi from "joi"

export const EnvConfig = Joi.object({
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    UPSTASH_REDIS_REST_URL: Joi.string().required(),
    UPSTASH_REDIS_REST_TOKEN: Joi.string().required()
})