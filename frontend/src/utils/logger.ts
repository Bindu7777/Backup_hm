/**
 * HappyMoments Production Logger
 * --------------------------------
 * Structured logging utility with ISO timestamps, log levels, and module tags.
 * Logs are always printed in production so issues can be traced in browser
 * DevTools (F12 → Console) or Vercel runtime logs.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   const log = logger('MyModule');
 *
 *   log.info('fetchLikedVendors', 'Starting fetch', { customerId: 42 });
 *   log.success('saveLike', 'Like saved!', { vendorId: 'abc' });
 *   log.warn('checkLike', 'API_BASE_URL is empty, skipping backend call');
 *   log.error('removeLike', 'Network failure', error);
 */

type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';

/** Returns current time as a readable ISO timestamp */
const ts = (): string => new Date().toISOString();

/** Returns current time in ms for performance timing */
const now = (): number => performance.now();

const ICONS: Record<LogLevel, string> = {
  INFO:    '🔵',
  SUCCESS: '✅',
  WARN:    '⚠️ ',
  ERROR:   '❌',
  DEBUG:   '🔍',
};

/**
 * Core print function — always logs, never stripped by build tools.
 */
function print(
  level: LogLevel,
  module: string,
  fn: string,
  message: string,
  data?: unknown
): void {
  const prefix = `${ICONS[level]} [${ts()}] [${module}] [${fn}]`;
  const text   = `${prefix} ${message}`;

  if (level === 'ERROR') {
    if (data !== undefined) {
      console.error(text, data);
    } else {
      console.error(text);
    }
  } else if (level === 'WARN') {
    if (data !== undefined) {
      console.warn(text, data);
    } else {
      console.warn(text);
    }
  } else {
    if (data !== undefined) {
      console.log(text, data);
    } else {
      console.log(text);
    }
  }
}

/**
 * Creates a namespaced logger for a module.
 *
 * @param module  - Short name of the file / component (e.g. 'LikedVendors')
 */
export function logger(module: string) {
  return {
    /** General informational log */
    info: (fn: string, message: string, data?: unknown) =>
      print('INFO', module, fn, message, data),

    /** Successful operation */
    success: (fn: string, message: string, data?: unknown) =>
      print('SUCCESS', module, fn, message, data),

    /** Non-fatal warning */
    warn: (fn: string, message: string, data?: unknown) =>
      print('WARN', module, fn, message, data),

    /** Error / failure */
    error: (fn: string, message: string, data?: unknown) =>
      print('ERROR', module, fn, message, data),

    /** Verbose debug detail */
    debug: (fn: string, message: string, data?: unknown) =>
      print('DEBUG', module, fn, message, data),

    /**
     * Times an async function and logs START / END with duration.
     *
     * @example
     *   const result = await log.time('fetchLikedVendors', () => getLikedVendors(id));
     */
    time: async <T>(fn: string, action: () => Promise<T>): Promise<T> => {
      const start = now();
      print('INFO', module, fn, '▶ START');
      try {
        const result = await action();
        const ms = (now() - start).toFixed(1);
        print('SUCCESS', module, fn, `■ END — completed in ${ms}ms`);
        return result;
      } catch (err) {
        const ms = (now() - start).toFixed(1);
        print('ERROR', module, fn, `■ END — failed after ${ms}ms`, err);
        throw err;
      }
    },
  };
}

export default logger;
