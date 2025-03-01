const STATE = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class SimplePromise {
  #STATE = STATE.PENDING;
  #value = null;
  #thenCbs = [];
  #catchCbs = [];

  constructor(cb) {
    cb(this.#onSuccess.bind(this), this.#onFail.bind(this));
  }

  #runCallbacks() {
    if (this.#STATE.FULFILLED) {
      this.#thenCbs.forEach((callback) => {
        callback(this.#value);
      });
    }

    if (this.#STATE.REJECTED) {
      this.#catchCbs.forEach((callback) => {
        callback(this.#value);
      });
    }
  }

  #onSuccess(value) {
    if (this.#STATE !== STATE.PENDING) return;
    this.#value = value;
    this.#STATE = STATE.FULFILLED;

    this.#runCallbacks();
  }

  #onFail(value) {
    if (this.#STATE !== STATE.PENDING) return;
    this.#value = value;
    this.#STATE = STATE.REJECTED;

    this.#runCallbacks();
  }

  then(cb) {
    // push to array that will be call cbs when promise is fulfilled
    this.#thenCbs.push(cb);
  }

  catch(cb) {
    this.#catchCbs.push(cb);
  }

  catch() {}

  finally() {}
}

module.exports = SimplePromise;
