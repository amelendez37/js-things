class SimplePromise {
  fulfilledValue = null;
  // rejectedValue = null;
  fulfilledCb = null;

  constructor(cb) {
    cb(this.onFulfilled.bind(this));
  }

  onFulfilled(value) {
    this.fulfilledValue = value;
  }

  then(cb) {
    // this is breaking test 2
    const nextFulfilledValue = cb(this.fulfilledValue);
    if (nextFulfilledValue !== undefined) {
      this.fulfilledValue = nextFulfilledValue;
    }
    return this;
  }

  catch() {}

  finally() {}
}

module.exports = SimplePromise;
