import { Inject } from '@nestjs/common';
import { DEFAULT_CONNECTION_NAME } from '../drizzle.constants.js';
import { getDrizzleToken } from './drizzle.utils.js';

/**
 * Injects the Drizzle database registered under the given connection name.
 * @param {string} [name='default'] Connection name
 *
 * @publicApi
 */
export const InjectDrizzle = (
  name: string = DEFAULT_CONNECTION_NAME,
): PropertyDecorator & ParameterDecorator => Inject(getDrizzleToken(name));
