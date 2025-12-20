// Core data structures implemented from scratch for the seating engine

class Queue {
  constructor() {
    this._items = [];
    this._head = 0;
  }

  enqueue(value) {
    this._items.push(value);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    const value = this._items[this._head];
    this._head += 1;
    // Periodically compact to avoid unbounded growth
    if (this._head > 50 && this._head * 2 > this._items.length) {
      this._items = this._items.slice(this._head);
      this._head = 0;
    }
    return value;
  }

  peek() {
    return this.isEmpty() ? null : this._items[this._head];
  }

  isEmpty() {
    return this.size() === 0;
  }

  size() {
    return this._items.length - this._head;
  }
}

class Stack {
  constructor() {
    this._items = [];
  }

  push(value) {
    this._items.push(value);
  }

  pop() {
    if (this.isEmpty()) return null;
    return this._items.pop();
  }

  peek() {
    return this.isEmpty() ? null : this._items[this._items.length - 1];
  }

  isEmpty() {
    return this._items.length === 0;
  }
}

// Binary heap based max-priority queue
class PriorityQueue {
  constructor(compareFn) {
    // compareFn(a, b) should return positive if a has higher priority than b
    this._heap = [];
    this._compare = compareFn || ((a, b) => a - b);
  }

  _parent(index) {
    return Math.floor((index - 1) / 2);
  }

  _leftChild(index) {
    return index * 2 + 1;
  }

  _rightChild(index) {
    return index * 2 + 2;
  }

  _swap(i, j) {
    const tmp = this._heap[i];
    this._heap[i] = this._heap[j];
    this._heap[j] = tmp;
  }

  _heapifyUp(index) {
    let i = index;
    while (i > 0) {
      const p = this._parent(i);
      if (this._compare(this._heap[i], this._heap[p]) <= 0) break;
      this._swap(i, p);
      i = p;
    }
  }

  _heapifyDown(index) {
    let i = index;
    const n = this._heap.length;
    while (true) {
      const left = this._leftChild(i);
      const right = this._rightChild(i);
      let largest = i;

      if (left < n && this._compare(this._heap[left], this._heap[largest]) > 0) {
        largest = left;
      }
      if (right < n && this._compare(this._heap[right], this._heap[largest]) > 0) {
        largest = right;
      }
      if (largest === i) break;
      this._swap(i, largest);
      i = largest;
    }
  }

  push(value) {
    this._heap.push(value);
    this._heapifyUp(this._heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;
    const root = this._heap[0];
    const last = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._heapifyDown(0);
    }
    return root;
  }

  peek() {
    return this.isEmpty() ? null : this._heap[0];
  }

  isEmpty() {
    return this._heap.length === 0;
  }

  size() {
    return this._heap.length;
  }
}

// Simple undirected graph with adjacency list
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
    if (a === null || b === null || a === undefined || b === undefined) return;
    this._ensureNode(a);
    this._ensureNode(b);
    this._adj.get(a).add(b);
    this._adj.get(b).add(a);
  }

  neighbors(id) {
    return this._adj.get(id) || new Set();
  }
}

// SeatGrid wraps a 2D array of seats and builds a seat adjacency graph
class SeatGrid {
  constructor(roomId, rows, cols) {
    this.roomId = roomId;
    this.rows = rows;
    this.cols = cols;
    this.seats = [];
    this.graph = new Graph();
    this._build();
  }

  _seatKey(row, col) {
    return `${this.roomId}:${row}:${col}`;
  }

  _build() {
    for (let r = 0; r < this.rows; r++) {
      const rowSeats = [];
      for (let c = 0; c < this.cols; c++) {
        const key = this._seatKey(r, c);
        const seat = {
          key,
          row: r,
          col: c,
          sessionId: null,
          sectionId: null,
          studentId: null,
          isEmpty: true,
        };
        rowSeats.push(seat);
        this.graph.addNode(key);
        // connect to left and top neighbors to build grid graph
        if (c > 0) {
          this.graph.addEdge(key, this._seatKey(r, c - 1));
        }
        if (r > 0) {
          this.graph.addEdge(key, this._seatKey(r - 1, c));
        }
      }
      this.seats.push(rowSeats);
    }
  }

  getSeat(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.seats[row][col];
  }

  getNeighbors(seat) {
    const keys = this.graph.neighbors(seat.key);
    const neighbors = [];
    for (const key of keys) {
      const [, rStr, cStr] = key.split(':');
      const r = parseInt(rStr, 10);
      const c = parseInt(cStr, 10);
      const neighbor = this.getSeat(r, c);
      if (neighbor) neighbors.push(neighbor);
    }
    return neighbors;
  }
}

module.exports = {
  Queue,
  Stack,
  PriorityQueue,
  Graph,
  SeatGrid,
};

