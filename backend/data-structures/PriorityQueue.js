// PriorityQueue (max-heap) implementation from scratch
class PriorityQueue {
  constructor(compareFn) {
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
module.exports = PriorityQueue;
