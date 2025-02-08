import * as Joi from 'joi';

export const ENV_VALIDATION_SCHEMA = Joi.object({
  DATABASE_USER: Joi.required(),
  DATABASE_PASSWORD: Joi.required(),
  DATABASE_HOST: Joi.required(),
  DATABASE_PORT: Joi.number().required(),
  DATABASE_NAME: Joi.required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
});
