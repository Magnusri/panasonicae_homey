// eslint-disable-next-line node/no-missing-import
import Homey from 'homey';
import { ComfortCloud, Power, dataMode } from 'panasonic-comfort-cloud-api';

class PanasonicACDevice extends Homey.Device {

  async fetchPanasonicData(device: any) {
    const client = this.homey.settings.get("panasonicClient") as ComfortCloud;

    await client.login();

    const deviceId = device.getData().id;
    const physicalDevice = await client.getDevice(deviceId);

    device.setCapabilityValue('onoff', physicalDevice.parameters.operate === Power.On);
    device.setCapabilityValue('measure_temperature.target', physicalDevice.parameters.temperatureSet);
    device.setCapabilityValue('measure_temperature.inside', physicalDevice.parameters.insideTemperature);
    device.setCapabilityValue('measure_temperature.outside', physicalDevice.parameters.outTemperature);

    return true;
  }

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('PanasonicACDevice has been initialized');

    const client = this.homey.settings.get("panasonicClient") as ComfortCloud;
    await client.login();

    const groups = await client.getGroups();

    const deviceId = groups[0].deviceList[0].deviceGuid;

    const device = await client.getDevice(deviceId);

    this.setCapabilityValue('onoff', device.parameters.operate === Power.On);
    this.setCapabilityValue('measure_temperature.target', device.parameters.temperatureSet);
    this.setCapabilityValue('measure_temperature.inside', device.parameters.insideTemperature);
    this.setCapabilityValue('measure_temperature.outside', device.parameters.outTemperature);

    this.registerCapabilityListener("onoff", async (value) => {
      const client = this.homey.settings.get("panasonicClient") as ComfortCloud;

      await client.setParameters(this.getData().id, {
        operate: value ? Power.On : Power.Off,
      });
    });

    // start polling temperature
    this.homey.setInterval(() => {
      this.fetchPanasonicData(this);
    }, 300000); // 5 minutes
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('PanasonicACDevice has been added');
}

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log("PanasonicACDevice settings where changed");
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('PanasonicACDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('PanasonicACDevice has been deleted');
  }

}

module.exports = PanasonicACDevice;
