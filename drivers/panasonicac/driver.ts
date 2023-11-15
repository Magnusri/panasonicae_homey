// eslint-disable-next-line node/no-missing-import
import Homey, { Device } from 'homey';
import { ComfortCloud, Power, dataMode } from 'panasonic-comfort-cloud-api';

class PanasonicACDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('PanasonicACDriver has been initialized');

    // Initialize "Then" flow cards
    const setTemperatureCard = this.homey.flow.getActionCard('set-temperature');
    setTemperatureCard.registerRunListener(async (args, state) => {
      this.log('set-temperature', args, state);

      const client = this.homey.settings.get("panasonicClient") as ComfortCloud;

      await client.setParameters(args.device.getData().id, {
        temperatureSet: args.temperature,
      });
      
      return Promise.resolve(true);
    });
  }

  async onPair(session: Homey.Driver.PairSession): Promise<void> {
    let username = "";
    let password = "";

    session.setHandler("login", async (data) => {
      username = data.username;
      password = data.password;

      const client = new ComfortCloud(username, password);

      const token = await client.login();

      if (token !== undefined) {
        this.log("Login successful");
        this.homey.settings.set("panasonicUsername", username);
        this.homey.settings.set("panasonicPassword", password);
        this.homey.settings.set("panasonicToken", token);
        this.homey.settings.set("panasonicClient", client);
        return true;
      } else {
        return false;
      }
    });

    session.setHandler("list_devices", async () => {
      const client = this.homey.settings.get("panasonicClient") as ComfortCloud;
      await client.login();
  
      const groups = await client.getGroups();
  
      const deviceId = groups[0].deviceList[0].deviceGuid;
      this.log(groups[0].deviceList[0]);
  
      const device = await client.getDevice(deviceId);
      this.log(device);
  
      const devices: Array<any> = [];
      groups.forEach((group) => {
        group.deviceList.forEach((device) => {
          devices.push({
            name: device.deviceName,
            data: {
              id: device.deviceGuid,
              moduleNumber: device.deviceModuleNumber,
            },
            // store: {
            //   address: '127.0.0.1',
            // },
          });
        });
      });
  
      return devices;
    });
  }
}

module.exports = PanasonicACDriver;
