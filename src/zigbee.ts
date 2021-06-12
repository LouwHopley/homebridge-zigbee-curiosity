import { Controller } from 'zigbee-herdsman';
import { API, Logger, PlatformConfig } from 'homebridge';
import path from 'path';

export class ZigbeeController {
  public readonly controller: Controller;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.controller = new Controller({
      // databasePath: this.config.database || '/var/lib/homebridge/zigbee.db',
      databasePath: config.database || path.join(api.user.storagePath(), './zigBee.db'),
    });

    this.controller.on('message', (data) => {
      this.log.debug('Controller ON message\n', JSON.stringify(data));
    });
    this.controller.on('deviceJoined', (data) => {
      this.log.info('Controller ON deviceJoined\n', JSON.stringify(data));
    });
    this.controller.on('deviceInterview', (data) => {
      this.log.info('Controller ON deviceInterview\n', JSON.stringify(data));
    });
    this.controller.on('deviceAnnounce', (data) => {
      this.log.info('Controller ON deviceAnnounce\n', JSON.stringify(data));
    });
    this.controller.on('deviceNetworkAddressChanged', (data) => {
      this.log.info('Controller ON deviceNetworkAddressChanged\n', JSON.stringify(data));
    });
    this.controller.on('deviceLeave', (data) => {
      this.log.info('Controller ON deviceLeave\n', JSON.stringify(data));
    });
    this.controller.on('permitJoinChanged', (data) => {
      this.log.info('Controller ON permitJoinChanged\n', JSON.stringify(data));
    });
    this.controller.on('adapterDisconnected', (data) => {
      this.log.info('Controller ON adapterDisconnected\n', JSON.stringify(data));
    });
  }

  async start() {
    return this.controller.start();
  }

  async onAttributeReport(f: (data) => void) {
    this.controller.on('message', (data) => {
      if (data.type === 'attributeReport') {
        return f(data);
      }
    });
  }
}
