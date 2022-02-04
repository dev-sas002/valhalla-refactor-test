/**
 * Base URL of the legacy image API.
 *
 * Overridable with the API_BASE_URL environment variable: webpack replaces the
 * `process.env.API_BASE_URL` expression at build time (see webpack.config.js),
 * and under Jest it is read from the real environment.
 */
export const DEFAULT_BASE_URL = "http://localhost:8888";

export const BASE_URL = process.env.API_BASE_URL || DEFAULT_BASE_URL;
