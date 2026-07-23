import { parsePageRange } from './ranges';
import { formatBytes, MAX_FILE_BYTES, MAX_PAGES } from './limits';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

/** Keep indices not in remove set — mirrors deletePagesBuffer selection rules. */
function keptPages(pageCount: number, removeIndices: number[]): number[] | string {
  const remove = new Set(removeIndices);
  for (const i of remove) {
    if (!Number.isInteger(i) || i < 0 || i >= pageCount) return 'bad index';
  }
  if (remove.size === 0) return 'none selected';
  if (remove.size >= pageCount) return 'would delete all';
  const keep: number[] = [];
  for (let i = 0; i < pageCount; i++) if (!remove.has(i)) keep.push(i);
  return keep;
}

function validOrder(pageCount: number, order: number[]): boolean {
  if (order.length !== pageCount) return false;
  const seen = new Set<number>();
  for (const i of order) {
    if (!Number.isInteger(i) || i < 0 || i >= pageCount || seen.has(i)) return false;
    seen.add(i);
  }
  return true;
}

assert(formatBytes(512) === '512 B', 'formatBytes B');
assert(formatBytes(2048) === '2.0 KB', 'formatBytes KB');
assert(MAX_FILE_BYTES === 50 * 1024 * 1024, 'MAX_FILE_BYTES');
assert(MAX_PAGES === 200, 'MAX_PAGES');

assert(parsePageRange(1, 3, 10), 'range ok object');
const ok = parsePageRange(2, 5, 10);
assert(typeof ok !== 'string' && ok.start === 1 && ok.end === 4, 'range indices');
assert(typeof parsePageRange(5, 2, 10) === 'string', 'from > to');
assert(typeof parsePageRange(0, 1, 10) === 'string', 'from < 1');
assert(typeof parsePageRange(1, 11, 10) === 'string', 'to > pageCount');

const kept = keptPages(5, [1, 3]);
assert(Array.isArray(kept) && kept.join(',') === '0,2,4', 'delete keep');
assert(keptPages(3, []) === 'none selected', 'delete empty');
assert(keptPages(2, [0, 1]) === 'would delete all', 'delete all');
assert(validOrder(3, [2, 0, 1]), 'reorder ok');
assert(!validOrder(3, [0, 0, 1]), 'reorder dup');
assert(!validOrder(3, [0, 1]), 'reorder short');

console.log('ok');
