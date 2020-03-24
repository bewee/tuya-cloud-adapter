'use strict';

const Property = require('gateway-addon').Property;

class NumberProperty extends Property {
  constructor(device, name) {
    super(device, name, {
      label: name,
      type: 'number',
      value: 0,
    });
    this.name = name;
  }

  update(value) {
    this.setCachedValueAndNotify(parseInt(value));
  }

  setValue(value) {
    return new Promise(((resolve, reject) => {
      super.setValue(value).then((updatedValue) => {
        this.device.tuyapi.setState({
          devId: this.device.tid,
          command: `${this.name}Set`,
          setState: value,
        });
        resolve(updatedValue);
      }).catch((err) => {
        reject(err);
      });
    }).bind(this));
  }
}

module.exports = NumberProperty;
