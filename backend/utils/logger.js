// Backend logger: one JSON line per log, printed with console.* so it shows up in
// Vercel's Logs tab (and anything that reads it). Every line has a timestamp,
// a level, the module and function it came from, a message and optional data.
// Never pass emails, phone numbers, passwords or tokens as data; ids are fine.

const LEVELS = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
const minLevel = LEVELS[(process.env.LOG_LEVEL || 'INFO').toUpperCase()] || LEVELS.INFO;

function write(level, module, fn, message, data) {
  if (LEVELS[level] < minLevel) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    module,
    fn,
    message,
  };
  if (data !== undefined) line.data = data;
  let text;
  try {
    text = JSON.stringify(line);
  } catch (e) {
    text = JSON.stringify({ ...line, data: '[unserializable]' });
  }
  if (level === 'ERROR') console.error(text);
  else if (level === 'WARN') console.warn(text);
  else console.log(text);
}

/** Turn an Error (or a Supabase error object) into plain fields for a log line. */
function errorFields(err) {
  if (!err) return null;
  return {
    name: err.name,
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint,
    stack: err.stack ? String(err.stack).split('\n').slice(0, 5).join(' | ') : undefined,
  };
}

/**
 * const log = require('../utils/logger')('likedVendors');
 * log.info('saveLike', 'Like saved', { customer_id, vendor_id });
 */
function logger(module) {
  return {
    debug: (fn, message, data) => write('DEBUG', module, fn, message, data),
    info: (fn, message, data) => write('INFO', module, fn, message, data),
    warn: (fn, message, data) => write('WARN', module, fn, message, data),
    error: (fn, message, data) => write('ERROR', module, fn, message, data),
  };
}

module.exports = logger;
module.exports.errorFields = errorFields;
