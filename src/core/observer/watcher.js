import Dep, { pushTarget, popTarget } from "./dep";
import { queueWatcher } from "./scheduler";

let uid = 0;

//  new Watcher(vm, updateComponent, noop, {}, true);
export default class Watcher {
  constructor(vm, expOrFn, cb, options, isRenderWatcher) {
    this.vm = vm;
    if (isRenderWatcher) {
      vm._watcher = this;
    }
    vm._watchers.push(this);
    // options
    if (options) {
      this.deep = !!options.deep;
      this.user = !!options.user;
      this.lazy = !!options.lazy;
      this.sync = !!options.sync;
      this.before = options.before;
    } else {
      this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb;
    this.id = ++uid; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();
    this.expression = expOrFn.toString();
    // parse expression for getter
    if (typeof expOrFn === "function") {
      this.getter = expOrFn;
    }
    this.value = this.lazy ? undefined : this.get();
  }
  get() {
    pushTarget(this);
    let value;
    const vm = this.vm;
    try {
      value = this.getter.call(vm, vm);
    } catch (e) {
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      // if (this.deep) {
      //   traverse(value);
      // }
      popTarget();
      // this.cleanupDeps();
    }
    return value;
  }

  /**
   * Add a dependency to this directive.
   */
  // dep和watcher是多对多关系
  addDep(dep) {
    const id = dep.id;
    // 一个属性可能在很多个地方被用到 一个属性有一个dep 确保没有重复的属性 newDepIds为dep的id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        // 向dep实例中的subs数组添加当前watcher
        dep.addSub(this);
      }
    }
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update() {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true;
    } else if (this.sync) {
      this.run();
    } else {
      queueWatcher(this);
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run() {
    if (this.active) {
      const value = this.get();
      // if (
      //   value !== this.value ||
      //   // Deep watchers and watchers on Object/Arrays should fire even
      //   // when the value is the same, because the value may
      //   // have mutated.
      //   isObject(value) ||
      //   this.deep
      // ) {
      //   // set new value
      //   const oldValue = this.value;
      //   this.value = value;
      //   if (this.user) {
      //     const info = `callback for watcher "${this.expression}"`;
      //     invokeWithErrorHandling(
      //       this.cb,
      //       this.vm,
      //       [value, oldValue],
      //       this.vm,
      //       info
      //     );
      //   } else {
      //     this.cb.call(this.vm, value, oldValue);
      //   }
      // }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps() {
    let i = this.deps.length;
    while (i--) {
      const dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    let tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  }
}
