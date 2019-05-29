class ServiceMock {

  constructor(id) {
    this.__TEST_ID__ = id;
    this.find = jest.fn();
    this.get = jest.fn();
    this.create = jest.fn();
    this.update = jest.fn();
    this.patch = jest.fn();
    this.remove = jest.fn();
  }

}

module.exports = {
  ServiceMock
}
