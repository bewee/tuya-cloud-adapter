'use strict';

const Property = require('gateway-addon').Property;

class BooleanProperty extends Property {
  constructor(device, name) {
    super(device, name, {
      label: name,
      type: 'boolean',
      value: false,
    });
    this.name = name;
  }

  update(value) {
    this.setCachedValueAndNotify(value);
  }

  setValue(value) {
    return new Promise(((resolve, reject) => {
      super.setValue(value).then((updatedValue) => {
        this.device.tuyapi.setState({
          devId: this.device.tid?1:0,
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

module.exports = BooleanProperty;
