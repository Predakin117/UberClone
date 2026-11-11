// AI-assisted: see docs/AI_LOG.md #54
// Without a connection Firestore can wait forever for the server: this gives up
// after ms milliseconds. Shared by accountService and driverRepository.
export const withTimeout = (
  promise,
  ms,
  createError = () => new Error("timeout"),
) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(createError()), ms);
  });
  // clearTimeout so a finished request doesn't leave a timer running
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};
