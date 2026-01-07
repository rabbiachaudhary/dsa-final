// Queue implementation from scratch
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
module.exports = Queue;
