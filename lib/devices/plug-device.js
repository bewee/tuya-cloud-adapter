'use strict';

const Device = require('gateway-addon').Device;
const PowerProperty = require('../properties/power-property');

class PlugDevice extends Device {
  constructor(adapter, tid, name, tuyapi) {
    super(adapter, `tuya-cloud-${tid}`);

    this.tid = tid;
    this.tuyapi = tuyapi;

    this.name = name;
    this['@type'] = ['SmartPlug', 'OnOffSwitch'];
    this.description = 'tuya plug';
  }

  addProperty(dat) {
    switch (dat) {
      case 'state':
        this.properties.set('state', new PowerProperty(this));
        break;
    }
  }

  run(ndata) {
    this.online = ndata.online;
    delete ndata.online;
    this.data = ndata;

    this.connectedNotify(this.online);
    for (const dat in this.data) {
      if (!this.properties.get(dat)) {
        if (this.addProperty(dat))
          this.adapter.handleDeviceUpdated(this);
      }
      if (this.properties.get(dat))
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

module.exports = PlugDevice;
