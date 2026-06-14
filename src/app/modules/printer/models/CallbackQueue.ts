export class CallbackQueue {
	private _queue: any[];
	private _working: boolean;

	constructor() {
		this._queue = [];
		this._working = false;
	}

	add(data: any) {
		const that = this;

		async function run() {
			if (!that._queue.length) {
				that._working = false;
				return;
			}

			that._working = true;

			const callback = that._queue.shift();
			await callback();

			run();
		}

		this._queue.push(data);

		if (!this._working) {
			run();
		}
	}

	sleep(ms: number) {
		this.add(() => new Promise(resolve => setTimeout(resolve, ms)));
	}
}
