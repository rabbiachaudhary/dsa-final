// HashMap implementation from scratch (simple, not for production)
class HashMap {
  constructor(size = 53) {
    this._buckets = Array(size).fill(null).map(() => []);
    this._size = size;
  }
  _hash(key) {
    let hash = 5381;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 33) ^ key.charCodeAt(i);
    }
    return Math.abs(hash) % this._size;
  }
  set(key, value) {
    const idx = this._hash(key);
    for (const pair of this._buckets[idx]) {
      if (pair[0] === key) {
        pair[1] = value;
        return;
      }
    }
    this._buckets[idx].push([key, value]);
  }
  get(key) {
    const idx = this._hash(key);
    for (const pair of this._buckets[idx]) {
      if (pair[0] === key) return pair[1];
    }
    return undefined;
  }
  has(key) {
    const idx = this._hash(key);
    for (const pair of this._buckets[idx]) {
      if (pair[0] === key) return true;
    }
    return false;
  }
  delete(key) {
    const idx = this._hash(key);
    this._buckets[idx] = this._buckets[idx].filter(pair => pair[0] !== key);
  }
}
module.exports = HashMap;
