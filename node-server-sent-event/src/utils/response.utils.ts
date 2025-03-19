/**
 * Constructs a standard Error object from the provided error input.
 * If the input is already an instance of Error, it returns it as is.
 * Otherwise, it converts the input to a string and creates a new Error.
 *
 * @example
 * const err1 = buildTypeSafeError(new Error('An error occurred.'));
 * console.log(err1.message); // 'An error occurred.'
 *
 * const err2 = buildTypeSafeError('Some other error message');
 * console.log(err2.message); // 'Some other error message'
 */
export function buildTypeSafeError<E extends Error>(error: unknown): E {
  const result = error instanceof Error ? error : new Error(String(error));

  return result as E;
}
