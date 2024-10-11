// File: app/api/chat/utils/validation.ts

/**
 * Type Guard to ensure the result is fulfilled with a non-null, non-empty string
 */
export function isFulfilledStringResult(
    result: PromiseSettledResult<string | null>
  ): result is PromiseFulfilledResult<string> {
    return (
      result.status === 'fulfilled' &&
      typeof result.value === 'string' &&
      result.value.trim() !== ''
    );
  }
  