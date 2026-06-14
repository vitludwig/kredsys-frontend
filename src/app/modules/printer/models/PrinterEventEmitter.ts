class PrinterEventEmitter {
	private _events: any;

	constructor() {
		this._events = {};
	}

	on(e: string, f: any) {
		this._events[e] = this._events[e] || [];
		this._events[e].push(f);
	}

	emit(e: string, ...args: any[]) {
		const fs = this._events[e];
		if (fs) {
			fs.forEach((f: any) => {
				setTimeout(() => f(...args), 0);
			});
		}
	}
}

export default PrinterEventEmitter;
