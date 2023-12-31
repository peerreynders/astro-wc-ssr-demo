// @ts-check
/** @template T */
class Multicast {
	/** @type { Set<(value: T) => void> } */
	sinks = new Set();

	clear() {
		this.clear;
	}

	get size() {
		return this.sinks.size;
	}

	/* Implemented as properties so that functions
	 * can be used directly without going through the
	 * specific Sinks<T> instance they are attached to.
	 */

	/**
	 * @param { (value: Readonly<T>) => void } sink
	 * @returns { () => void }
	 */
	add = (sink) => {
		const remove = () => void this.sinks.delete(sink);
		this.sinks.add(sink);
		return remove;
	};

	/** @param { Readonly<T> } value
	 * @returns { void }
	 */
	send = (value) => {
		for (const sink of this.sinks) sink(value);
	};
}

export { Multicast };
