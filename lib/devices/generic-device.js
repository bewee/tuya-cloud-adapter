'use strict';

const Device = require('gateway-addon').Device;
const BooleanProperty = require('../properties/boolean-property');
const NumberProperty = require('../properties/number-property');
const StringProperty = require('../properties/string-property');
const PowerProperty = require('../properties/power-property');

class GenericDevice extends Device {
  constructor(adapter, tid, name, tuyapi, devType) {
    super(adapter, `tuya-cloud-${tid}`);

    console.warn(`Unknown device type ${devType}`);

    this.tid = tid;
    this.tuyapi = tuyapi;

    this.name = name;
    this['@type'] = [];
    this.description = 'tuya generic device';
  }

  addProperty(dat) {
    switch (dat) {
      case 'state':
        this['@type'] = ['OnOffSwitch'];
        this.properties.set('state', new PowerProperty(this));
        break;
      default:
        console.error(this.id, `Unknown property ${dat}`);
        switch (typeof this.data[dat]) {
          case 'boolean':
            this.properties.set(dat, new BooleanProperty(this, dat));
            break;
          case 'number':
            this.properties.set(dat, new NumberProperty(this, dat));
            break;
          default:
            this.properties.set(dat, new StringProperty(this, dat));
            break;
        }
        break;
    }
  }

  setVisibility(list) {
    for (const [key, prop] of this.properties) {
      if (list.includes(key))
        prop.visible = true;
      else
        prop.visible = false;
    }
  }

  run(ndata) {
    this.online = ndata.online;
    delete ndata.online;
    this.data = ndata;

    this.connectedNotify(this.online);
    for (const dat in this.data) {
      if (!this.properties.get(dat)) {
        this.addProperty(dat);
        this.adapter.handleDeviceUpdated(this);
      }
      this.properties.get(dat).update(this.data[dat]);
    }
  }

  stop() {
    console.log(this.id, 'Stop!');
  }

  connectedNotify(stat) {
    super.connectedNotify(stat);
    if (!('connected' in this)) {
      this.connected = stat;
      return;
    }
    if (this.connected !== stat) {
      if (stat) {
        console.log(this.id, 'Connected!');
      } else {
        console.log(this.id, 'Disconnected!');
      }
      this.connected = stat;
    }
  }
}

module.exports = GenericDevice;
