// file: src/app/lib/multicast.ts
class Multicast {
	sinks = new Set<() => void>();

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
	add = (flush: () => void) => {
		const remove = () => void this.sinks.delete(flush);
		this.sinks.add(flush);
		return remove;
	};

	send = () => {
		for (const sink of this.sinks) sink();
	};
}

export { Multicast };
