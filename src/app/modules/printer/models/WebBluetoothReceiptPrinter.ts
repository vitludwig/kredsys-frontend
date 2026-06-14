import {CallbackQueue} from "./CallbackQueue";
import {DeviceProfiles} from "./DeviceProfiles";
import PrinterEventEmitter from "./PrinterEventEmitter";
import {SavedPrinterNotFound} from "../exceptions/SavedPrinterNotFound";
import {signal} from "@angular/core";

export class WebBluetoothReceiptPrinter {
	public connectInProgress = signal(false);

	#emitter;
	#queue;

	#device: BluetoothDevice | null = null;
	#profile: any = null;
	#characteristics: { print: any | null, status: any | null } = {
		print: null,
		status: null
	};

	constructor() {
		this.#emitter = new PrinterEventEmitter();
		this.#queue = new CallbackQueue();

		navigator.bluetooth.addEventListener('disconnect', (event: any) => {
			if (this.#device == event.device) {
				this.#emitter.emit('disconnected');
			}
		});
	}

	async connect() {
		// @ts-ignore
		const filters = DeviceProfiles.map(i => i.filters).reduce((a, b) => a.concat(b));
		const optionalServices = DeviceProfiles.map(i => Object.values(i.functions).map(f => f.service)).reduce((a, b) => a.concat(b)).filter((v, i, a) => a.indexOf(v) === i);

		try {
			const device = await navigator.bluetooth.requestDevice({
				filters, optionalServices
			});

			if (device) {
				await this.#tryOpen(device);
			}
		} catch (error) {
			console.log('Could not connect! ' + error);
		}
	}

	async reconnect(previousDevice: BluetoothDevice) {
		if (!navigator.bluetooth.getDevices) {
			return;
		}

		const devices = await navigator.bluetooth.getDevices();

		const device = devices.find(device => device.id == previousDevice.id);

		if (!device) {
			throw new SavedPrinterNotFound();
		}

		await this.#tryOpen(device);
	}

	async #tryOpen(device: BluetoothDevice) {
		this.connectInProgress.set(true);
		await device.watchAdvertisements();
		// wait until in range
		device.onadvertisementreceived = async (e: BluetoothAdvertisingEvent) => {
			console.log('advertiesment received', e);
			if (this.#device?.gatt?.connected) {
				// @ts-ignore
				this.#device.onadvertisementreceived = undefined;
				return;
			}

			await this.#open(device);
		}
	}

	async #open(device: BluetoothDevice) {
		this.connectInProgress.set(true);

		this.#device = device;
		if (!this.#device || !this.#device.gatt) {
			console.error("No device selected");
			this.connectInProgress.set(false);
			return;
		}

		const server = await this.#device.gatt.connect();
		const services = await server.getPrimaryServices();
		const uuids = services.map((service: any) => service.uuid);

		/* Find profile for device */

		this.#profile = DeviceProfiles.find(item => item.filters.some(filter => this.#evaluateFilter(filter, uuids)));

		/* Get characteristics and service for printing */

		const printService = await server.getPrimaryService(this.#profile.functions.print.service);

		this.#characteristics.print =
      await printService.getCharacteristic(this.#profile.functions.print.characteristic);

		/* Get characteristics and service for status */

		if (this.#profile.functions.status) {
			const statusService = await server.getPrimaryService(this.#profile.functions.status.service);

			this.#characteristics.status =
        await statusService.getCharacteristic(this.#profile.functions.status.characteristic);
		}

		/* Emit connected event */

		this.#emitter.emit('connected', {
			type: 'bluetooth',
			name: this.#device.name,
			id: this.#device.id,
			language: await this.#evaluate(this.#profile.language),
			codepageMapping: await this.#evaluate(this.#profile.codepageMapping)
		});
		this.connectInProgress.set(false);
	}

	async #evaluate(expression: any) {
		if (typeof expression == 'function') {
			return await expression(this.#device);
		}

		return expression;
	}

	#evaluateFilter(filter: any, uuids: string[]) {
		if (filter.services) {
			for (const service of filter.services) {
				if (!uuids.includes(service)) {
					return false;
				}
			}
		}

		if (filter.name) {
			if (this.#device?.name != filter.name) {
				return false;
			}
		}

		if (filter.namePrefix) {
			if (!this.#device?.name?.startsWith(filter.namePrefix)) {
				return false;
			}
		}

		return true;
	}

	async listen() {
		if (this.#characteristics.status) {
			await this.#characteristics.status.startNotifications();

			this.#characteristics.status.addEventListener("characteristicvaluechanged", (e: any) => {
				this.#emitter.emit('data', e.target.value);
			});

			return true;
		}

		return false;
	}

	async disconnect() {
		if (!this.#device || !this.#device.gatt) {
			return;
		}

		await this.#device.gatt.disconnect();

		this.#device = null;
		this.#characteristics.print = null;
		this.#characteristics.status = null;
		this.#profile = null;

		this.#emitter.emit('disconnected');
	}

	print(commands: any[]): Promise<void> {
		return new Promise((resolve: any) => {
			if (ArrayBuffer.isView(commands)) {
				commands = [commands];
			}

			for (const command of commands) {
				const maxLength = this.#profile.messageSize || 100;
				const chunks = Math.ceil(command.length / maxLength);

				if (chunks === 1) {
					const data = command;

					this.#queue.add(() => this.#characteristics.print.writeValueWithResponse(data));

					if (this.#profile.sleepAfterCommand) {
						this.#queue.sleep(this.#profile.sleepAfterCommand);
					}
				} else {
					for (let i = 0; i < chunks; i++) {
						const byteOffset = i * maxLength;
						const length = Math.min(command.length, byteOffset + maxLength);
						const data = command.slice(byteOffset, length);

						this.#queue.add(() => this.#characteristics.print.writeValueWithResponse(data));

						if (this.#profile.sleepAfterCommand) {
							this.#queue.sleep(this.#profile.sleepAfterCommand);
						}
					}
				}
			}

			this.#queue.add(() => resolve());
		});
	}

	addEventListener(n: any, f: any) {
		this.#emitter.on(n, f);
	}

	isConnected() {
		return !!this.#device;
	}
}
