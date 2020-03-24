'use strict';

const Adapter = require('gateway-addon').Adapter;
const Database = require('gateway-addon').Database;
const manifest = require('../manifest.json');
const CloudTuya = require('./cloudtuya');
const PlugDevice = require('./devices/plug-device');
const LampDevice = require('./devices/lamp-device');
const GenericDevice = require('./devices/generic-device');

const countryCodes = new Map();
countryCodes.set('Americas', 'az');
countryCodes.set('Asia', 'cn');
countryCodes.set('Europe', 'eu');
countryCodes.set('United States', 'us');

class TuyaAdapter extends Adapter {
  constructor(addonManager) {
    super(addonManager, 'TuyaAdapter', manifest.id);
    addonManager.addAdapter(this);
    this.savedDevices = [];

    this.db = new Database(this.packageName);
    this.db.open().then((() => {
      return this.db.loadConfig();
    }).bind(this)).then(((config) => {
      this.config = config;
      return Promise.resolve();
    }).bind(this)).then((async () => {
      this.tuyapi = new CloudTuya({
        userName: this.config.userName,
        password: this.config.password,
        countryCode: countryCodes.get(this.config.countryCode),
        region: this.config.region,
        bizType: this.config.bizType,
      });
      await this.tuyapi.login();
      await this.updateDevices();
      setInterval(this.updateDevices.bind(this), this.config.pollInterval*1000);
    }).bind(this)).catch(console.error);
  }

  async updateDevices() {
    const tdevices = await this.tuyapi.find();
    for (const t of tdevices) {
      let d;
      if (this.devices[`tuya-cloud-${t.id}`]) {
        d = this.devices[`tuya-cloud-${t.id}`];
      } else {
        switch (t.dev_type) {
          case 'switch':
            d = new PlugDevice(this, t.id, t.name, this.tuyapi);
            break;
          case 'light':
            d = new LampDevice(this, t.id, t.name, this.tuyapi);
            break;
          case 'scene':
            // not supported yet
            break;
          default:
            d = new GenericDevice(this, t.id, t.name, this.tuyapi, t.dev_type);
            break;
        }
        if (d)
          this.handleDeviceAdded(d);
      }
      if (d && this.savedDevices.includes(d.id)) {
        d.run(t.data);
      }
    }
  }

  handleDeviceAdded(device, reload = false) {
    super.handleDeviceAdded(device);
    if (reload) return;
    console.log('Thing added', device.id);
    device.connectedNotify(false);
  }

  handleDeviceUpdated(device) {
    super.handleDeviceAdded(device, true);
    console.log('Thing updated', device.id);
  }

  handleDeviceSaved(deviceId) {
    super.handleDeviceSaved(deviceId);
    this.savedDevices.push(deviceId);
    if (this.devices[deviceId]) {
      const device = this.devices[deviceId];
      console.log('Thing saved', deviceId);
      device.connectedNotify(false);
      this.tuyapi.state({
        devId: device.tid,
      }).then((data) => (device.run(data)));
    }
  }

  startPairing(_timeoutSeconds) {
    console.log('pairing started');
  }

  cancelPairing() {
    console.log('pairing cancelled');
  }

  handleDeviceRemoved(device) {
    super.handleDeviceRemoved(device);
    device.stop();
    console.log('Thing removed', device.id);
  }

  removeThing(device) {
    console.log('removeThing(', device.id, ')');

    this.handleDeviceRemoved(device);
    if (this.savedDevices.includes(device.id))
      this.savedDevices.splice(this.savedDevices.indexOf(device.id), 1);
  }

  cancelRemoveThing(device) {
    console.log('cancelRemoveThing(', device.id, ')');
  }
}

module.exports = TuyaAdapter;
