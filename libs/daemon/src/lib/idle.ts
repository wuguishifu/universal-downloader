export type IdleTimer = {
  touch(): void;
  stop(): void;
};

export function createIdleTimer(
  timeoutMs: number,
  onTimeout: () => void,
): IdleTimer {
  let timer = setTimeout(onTimeout, timeoutMs);

  return {
    touch() {
      clearTimeout(timer);
      timer = setTimeout(onTimeout, timeoutMs);
    },
    stop() {
      clearTimeout(timer);
    },
  };
}
