/**
 * rollup entrypoint to generate the exact subset that we need
 * from `mathjs`
 */
import { create, parseDependencies } from 'mathjs';
export const { parse } = create({ parseDependencies }, {});
