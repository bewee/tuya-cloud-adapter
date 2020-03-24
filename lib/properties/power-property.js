'use strict';

const Property = require('gateway-addon').Property;

class PowerProperty extends Property {
  constructor(device) {
    super(device, 'state', {
      '@type': 'OnOffProperty',
      label: 'On/Off',
      type: 'boolean',
      value: false,
    });
  }

  update(value) {
    this.setCachedValueAndNotify(value);
  }

  setValue(value) {
    return new Promise((resolve, reject) => {
      super.setValue(value).then(((updatedValue) => {
        this.device.tuyapi.setState({
          devId: this.device.tid,
          command: 'turnOnOff',
          setState: value?1:0,
        });
        resolve(updatedValue);
      }).bind(this)).catch((err) => {
        reject(err);
      });
    });
  }
}

module.exports = PowerProperty;
