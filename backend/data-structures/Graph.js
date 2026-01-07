// Graph implementation from scratch (undirected)
class Graph {
  constructor() {
    this._adj = new Map();
  }
  _ensureNode(id) {
    if (!this._adj.has(id)) {
      this._adj.set(id, new Set());
    }
  }
  addNode(id) {
    this._ensureNode(id);
  }
  addEdge(a, b) {
    if (a == null || b == null) return;
    this._ensureNode(a);
    this._ensureNode(b);
    this._adj.get(a).add(b);
    this._adj.get(b).add(a);
  }
  neighbors(id) {
    return this._adj.get(id) || new Set();
  }
  hasNode(id) {
    return this._adj.has(id);
  }
  removeEdge(a, b) {
    if (this._adj.has(a)) this._adj.get(a).delete(b);
    if (this._adj.has(b)) this._adj.get(b).delete(a);
  }
  removeNode(id) {
    if (!this._adj.has(id)) return;
    for (const neighbor of this._adj.get(id)) {
      this._adj.get(neighbor).delete(id);
    }
    this._adj.delete(id);
  }
}
module.exports = Graph;
