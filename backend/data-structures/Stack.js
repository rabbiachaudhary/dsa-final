// Stack implementation from scratch
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
  size() {
    return this._items.length;
  }
}
module.exports = Stack;
