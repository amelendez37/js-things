const STATE = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class MyPromise {
  #boundOnSuccess = this.#onSuccess.bind(this);
  #boundOnFail = this.#onFail.bind(this);
  #thenCbs = [];
  #catchCbs = [];
  #state = STATE.PENDING;
  #value;

  constructor(cb) {
    try {
      cb(this.#boundOnSuccess, this.#boundOnFail);
    } catch (err) {
      throw new Error(err);
    }
  }

  #runCallbacks() {
    if (this.#state === STATE.FULFILLED) {
      this.#thenCbs.forEach((cb) => {
        cb(this.#value);
      });

      this.#thenCbs = [];
    }

    if (this.#state === STATE.REJECTED) {
      this.#catchCbs.forEach((cb) => {
        cb(this.#value);
      });

      this.#catchCbs = [];
    }

    // run finally callbacks here?
  }

  #onSuccess(value) {
    queueMicrotask(() => {
      if (this.#state !== STATE.PENDING) return;

      if (value instanceof MyPromise) {
        value.then(this.#boundOnSuccess, this.#boundOnFail);
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

      this.#value = value;
      this.#state = STATE.REJECTED;
      this.#runCallbacks();
    });
  }

  then(successCb, failCb) {
    return new MyPromise((resolve, reject) => {
      this.#thenCbs.push((result) => {
        if (!successCb) {
          resolve(result);
          return;
        }

        try {
          resolve(successCb(result));
        } catch (err) {
          reject(err);
        }
      });

      this.#catchCbs.push((result) => {
        if (!failCb) {
          reject(result);
          return;
        }

        try {
          resolve(failCb(result));
        } catch (err) {
          reject(err);
        }
      });

      this.#runCallbacks();
    });
  }

  catch(cb) {
    return this.then(null, cb);
  }

  finally(cb) {
    return this.then(
      (v) => {
        cb();
        return v;
      },
      (e) => {
        cb();
        throw e;
      }
    );
  }

  static resolve(v) {
    return new MyPromise((resolve) => resolve(v));
  }

  static reject(v) {
    return new MyPromise((_, reject) => reject(v));
  }

  static all(promises) {
    const result = [];
    let completed = 0;

    return new MyPromise((resolve, reject) => {
      promises.forEach((promise, index) => {
        promise
          .then((v) => {
            result[index] = v;
            completed++;

            if (completed === promises.length) {
              resolve(result);
            }
          })
          .catch(reject);
      });
    });
  }
}

module.exports = MyPromise;
