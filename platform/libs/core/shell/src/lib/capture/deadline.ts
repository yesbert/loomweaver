export function withinDeadline<T>(
  work: Promise<T>,
  timeoutMs: number,
): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), timeoutMs);
  });
  return Promise.race([work.catch(() => undefined), deadline]).finally(() =>
    clearTimeout(timer),
  );
}
