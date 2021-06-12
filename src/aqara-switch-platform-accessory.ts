import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { CuriosityHomebridgePlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class AqaraSwitchPlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: CuriosityHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Aqara')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.modelID)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.modelID);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    // eslint-disable-next-line max-len
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    // this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.handleOnSet.bind(this))   // SET - bind to the `setOn` method below
      .onGet(this.handleOnGet.bind(this));  // GET - bind to the `getOn` method below

    this.platform.zigbeeController.onAttributeReport((payload) => {
      if (payload.device._ieeeAddr === this.accessory.context.device.ieeeAddr) {
        if ('onOff' in payload.data && '61440' in payload.data) { // Not sure, but "61440":59891968 is always present in the correct state
          this.platform.log.info(`State report: ${this.accessory.displayName} ${payload.data.onOff}`);
          const on = payload.data.onOff === 1;
          this.service.getCharacteristic(this.platform.Characteristic.On)
            .setValue(on);
          // TODO: set the state of this accessory, but first monitor if an infinite loop will be created
        }
      }
    });
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async handleOnSet(value: CharacteristicValue) {
    if (this.service.getCharacteristic(this.platform.Characteristic.On).value === value) {
      this.platform.log.debug('handleOnSet value already matching. Doing nothing.');
      return;
    }
    // implement your own code to turn your device on/off
    this.platform.log.debug(`Setting '${this.accessory.displayName}' to ${value ? 'ON' : 'OFF'}`);

    // https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L53
    const device = this.platform.zigbeeController.controller.getDeviceByIeeeAddr(this.accessory.context.device.ieeeAddr);
    // this.platform.log.debug('Device:', device);

    const endpoint = device.endpoints[0];
    // this.platform.log.debug('Endpoint:', endpoint);

    // TODO: this part still needs to be figured out
    const clusterKey = 'aqaraOpple';
    const payload = {
      0x000A: {
        value: value ? 1 : 0,
        // type: 0x20,
        onOff: value ? 1 : 0,
        type: 'write',
      },
    };
    // const options = {
    //   manufacturerCode: 0x115F, //herdsman.Zcl.ManufacturerCode.LUMI_UNITED_TECH,
    //   disableDefaultResponse: true,
    // };
    this.platform.log.debug('Attempting write with payload:\n', payload);

    await endpoint.write(clusterKey, payload);
    // await endpoint.write(clusterKey, payload, options);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async handleOnGet(): Promise<CharacteristicValue> {
    this.platform.log.debug(`Getting state of '${this.accessory.displayName}'`);
    return this.service.getCharacteristic(this.platform.Characteristic.On).value || false;
  }
}
