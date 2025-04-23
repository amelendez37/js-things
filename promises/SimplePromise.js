const STATE = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class MyPromise {
  #thenCbs = [];
  #catchCbs = [];
  #state = STATE.PENDING;
  #value;
  #onSuccessBind = this.#onSuccess.bind(this);
  #onFailBind = this.#onFail.bind(this);

  constructor(cb) {
    try {
      cb(this.#onSuccessBind, this.#onFailBind);
    } catch (e) {
      this.#onFail(e);
    }
  }

  #runCallbacks() {
    if (this.#state === STATE.FULFILLED) {
      this.#thenCbs.forEach((callback) => {
        callback(this.#value);
      });

      this.#thenCbs = [];
    }

    if (this.#state === STATE.REJECTED) {
      this.#catchCbs.forEach((callback) => {
        callback(this.#value);
      });

      this.#catchCbs = [];
    }
  }

  #onSuccess(value) {
    queueMicrotask(() => {
      if (this.#state !== STATE.PENDING) return;
      // if what is returned from the promise is also a promise
      if (value instanceof MyPromise) {
        value.then(this.#onSuccessBind, this.#onFailBind);
        return;
      }

      this.#value = value;
      this.#state = STATE.FULFILLED;
      this.#runCallbacks();
    });
  }

  #onFail(value) {
    queueMicrotask(() => {
      if (this.#state !== STATE.PENDING) return;

      if (value instanceof MyPromise) {
        value.then(this.#onSuccessBind, this.#onFailBind);
        return;
      }

      this.#value = value;
      this.#state = STATE.REJECTED;
      this.#runCallbacks();
    });
  }

  then(thenCb, catchCb) {
    return new MyPromise((resolve, reject) => {
      this.#thenCbs.push((result) => {
        if (!thenCb) {
          resolve(result);
          return;
        }

        try {
          resolve(thenCb(result));
        } catch (e) {
          reject(e);
        }
      });

      this.#catchCbs.push((result) => {
        if (!catchCb) {
          reject(result);
          return;
        }

        try {
          resolve(catchCb(result));
        } catch (e) {
          reject(e);
        }
      });

      // for if promise is called after initially fulfilled
      this.#runCallbacks();
    });
  }

  catch(cb) {
    return this.then(undefined, cb);
  }

  finally(cb) {
    return this.then(
      (res) => {
        cb();
        return res;
      },
      (err) => {
        cb();
        throw err;
      }
    );
  }

  static resolve(value) {
    return new Promise((resolve) => resolve(value));
  }

  static reject(value) {
    return new Promise((_, reject) => reject(value));
  }

  static all(promises) {
    return new Promise((resolve, reject) => {
      const all = [];
      let completed = 0;

      promises.forEach((promise, index) => {
        Promise.resolve(promise)
          .then((value) => {
            all[index] = value;
            completed++;
            if (completed === promises.length) {
              resolve(all);
            }
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
  }

  // always resolves as success, resolves to an array of objects of { status: 'fulfilled' | 'rejected, value: (if fulfilled), reason: (if rejected) }
  static allSettled(promises) {
    const results = [];
    return new Promise((resolve) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i]
          .then((v) => {
            results.push({ status: "fulfilled", value: v });
          })
          .catch((err) => {
            results.push({ status: "rejected", reason: err });
          })
          .finally(() => {
            if (results.length === promises.length) {
              resolve(results);
            }
          });
      }
    });
  }

  // returns promise that resolves to first fulfilled/rejected promise passed in iterable
  static race(promises) {
    return new Promise((resolve, reject) => {
      promises.forEach((promise) => {
        promise.then(resolve).catch(reject);
      });
    });
  }

  // This returned promise fulfills when any of the input's promises fulfills, with this first fulfillment value. It rejects when all of the input's promises reject (including when an empty iterable is passed), with an AggregateError containing an array of rejection reasons.
  static any(promises) {
    const errors = [];
    let rejectedPromisesCount = 0;
    return new Promise((resolve, reject) => {
      promises.forEach((promise, i) => {
        promise
          .then((v) => {
            resolve(v);
          })
          .catch((err) => {
            rejectedPromisesCount++;
            errors[i] = err;
            if (rejectedPromisesCount === promises.length) {
              reject(new AggregateError(errors, "All promises rejected"));
            }
          });
      });
    });
  }
}

class UncaughtPromiseError extends Error {
  constructor(error) {
    super(error);
    this.stack = `(in promise) ${error.stack}`;
  }
}

module.exports = MyPromise;
