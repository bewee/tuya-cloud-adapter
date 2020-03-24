'use strict';

const Property = require('gateway-addon').Property;

class BrightnessProperty extends Property {
  constructor(device, name) {
    super(device, 'brightness', {
      label: 'Brightness',
      type: 'integer',
      '@type': 'BrightnessProperty',
      value: 1,
      min: 1,
      max: 100,
    });
    this.name = name;
  }

  update(value) {
    this.setCachedValueAndNotify(parseInt(value)/10);
  }

  setValue(value) {
    return new Promise(((resolve, reject) => {
      super.setValue(value).then((updatedValue) => {
        this.device.tuyapi.setState({
          devId: this.device.tid,
          command: `brightnessSet`,
          setState: value,
        });
        resolve(updatedValue);
      }).catch((err) => {
        reject(err);
      });
    }).bind(this));
  }
}

module.exports = BrightnessProperty;
