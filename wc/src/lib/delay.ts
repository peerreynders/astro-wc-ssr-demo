// file: src/lib/delay.ts

function makeDelay<T>(ms = 300) {
	return function delay(value: T) {
		return ms < 1
			? value
			: new Promise((resolve, _reject) => {
					setTimeout(() => resolve(value), ms);
			  });
	};
}

export { makeDelay };
