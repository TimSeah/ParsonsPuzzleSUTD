// Bounded concurrency for Lean compiles: each compile loads Mathlib and can
// use gigabytes of memory, so only `maxConcurrent` run at once and at most
// `maxQueue` more wait. Anything beyond that is rejected immediately.
export function createLimiter({ maxConcurrent = 1, maxQueue = 2 } = {}) {
  let active = 0;
  const queue = [];

  const next = () => {
    if (active >= maxConcurrent || queue.length === 0) return;
    active += 1;
    const { task, resolve, reject } = queue.shift();
    // Free the slot before settling so callers observe up-to-date stats.
    const settle = (fn) => (value) => {
      active -= 1;
      fn(value);
      next();
    };
    Promise.resolve().then(task).then(settle(resolve), settle(reject));
  };

  return {
    run(task) {
      if (active >= maxConcurrent && queue.length >= maxQueue) {
        return Promise.reject(Object.assign(new Error('Lean worker is busy'), { code: 'BUSY' }));
      }
      return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject });
        next();
      });
    },
    stats: () => ({ active, queued: queue.length, maxConcurrent, maxQueue }),
  };
}
