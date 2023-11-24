// file: src/app/available-status.ts
const availableStatus = {
	UNAVAILABLE: -1,
	WAIT: 0,
	READY: 1,
} as const;

export type AvailableStatus =
	(typeof availableStatus)[keyof typeof availableStatus];

export { availableStatus };
