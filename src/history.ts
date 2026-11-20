export interface Entry { label: string; undo(): void; redo(): void; key?: string; time?: number }

export class History {
  private stack: Entry[] = [];
  private idx = 0;
  onChange: (() => void) | null = null;

  push(e: Entry) {
    e.time = Date.now();
    if (e.key && this.idx === this.stack.length && this.idx > 0) {
      const last = this.stack[this.idx - 1];
      if (last.key === e.key && e.time - (last.time || 0) < 1200) {
        last.redo = e.redo; last.time = e.time;
        this.onChange?.();
        return;
      }
    }
    this.stack.splice(this.idx);
    this.stack.push(e);
    if (this.stack.length > 80) this.stack.shift();
    this.idx = this.stack.length;
    this.onChange?.();
  }
  undo() { if (this.idx > 0) { this.stack[--this.idx].undo(); this.onChange?.(); } }
  redo() { if (this.idx < this.stack.length) { this.stack[this.idx++].redo(); this.onChange?.(); } }
  get canUndo() { return this.idx > 0; }
  get canRedo() { return this.idx < this.stack.length; }
  clear() { this.stack = []; this.idx = 0; this.onChange?.(); }
}
