type TimerId = ReturnType<typeof setTimeout>;

const map = new Map<number, TimerId>();

let waitingIntervalId = 0;

function iterateUntilLast(arr: readonly number[]): () => number {
    if (!arr.length) {
        throw new Error('Array must not be empty');
    }

    let i = arr.length - 1;
    return () => (i > 0 ? arr[i--] : arr[0]);
}

/**
 * This function mimics the behavior of setInterval with one key difference:
 * if the callback function takes too long to execute or if the browser throttles,
 * subsequent calls to the callback function will not occur.
 *
 * Additionally, we pass an array of timeouts to define an increasing delay period.
 * For example, given the array [16, 8, 4, 2], the delays will be 2, 4, 8, 16, 16, 16...
 */
export function setWaitingInterval<T extends unknown[]>(handler: (...args: T) => void, timeouts: readonly number[], ...args: T): number {
    const id = ++waitingIntervalId;

    const getLastUntilOneLeft = iterateUntilLast(timeouts);

    function internalHandler(...argsInternal: T): void {
        if (!map.has(id)) {
            return
        }

        try {
            handler(...argsInternal);
        } finally {
            if (!map.has(id)) {
                return
            }

            map.set(
                id,
                setTimeout(internalHandler, getLastUntilOneLeft(), ...args)
            );
        }
    }

    map.set(
        id,
        setTimeout(internalHandler, getLastUntilOneLeft(), ...args)
    );

    return id;
}

export function clearWaitingInterval(intervalId: number): void {
    const realTimeoutId = map.get(intervalId);

    if (realTimeoutId !== undefined) {
        map.delete(intervalId);
        clearTimeout(realTimeoutId);
    }
}