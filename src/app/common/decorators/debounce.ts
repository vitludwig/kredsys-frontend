// TODO: replace this for prettier debounce
export function debounce(delay: number = 500) {
	return function(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
		let timeout: any = null;

		const original = descriptor.value;

		descriptor.value = function(...args: any): void {
			// @ts-ignore
			clearTimeout(timeout);
			timeout = setTimeout(() => original.apply(this, args), delay);
		};

		return descriptor;
	};
}
