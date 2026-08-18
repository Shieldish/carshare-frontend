import { ApiError } from './apiClient';

type ToastErrorKey =
  | 'generic'
  | 'unexpected'
  | 'network'
  | 'invalidCredentials'
  | 'emailAlreadyExists'
  | 'validationError'
  | 'expiredOrError'
  | 'startDateNotInFuture'
  | 'endDateNotInFuture'
  | 'startAfterEnd'
  | 'bookingTooShort'
  | 'missingDates'
  | 'tooManyPendingBookings'
  | 'bookingRateLimitExceeded'
  | 'tooManyPendingBoostPayments'
  | 'boostRateLimitExceeded';

const CODE_TO_KEY: Record<string, ToastErrorKey> = {
  INVALID_CREDENTIALS: 'invalidCredentials',
  EMAIL_ALREADY_EXISTS: 'emailAlreadyExists',
  VALIDATION_ERROR: 'validationError',
  START_DATE_NOT_IN_FUTURE: 'startDateNotInFuture',
  END_DATE_NOT_IN_FUTURE: 'endDateNotInFuture',
  START_AFTER_END: 'startAfterEnd',
  BOOKING_TOO_SHORT: 'bookingTooShort',
  MISSING_DATES: 'missingDates',
  TOO_MANY_PENDING_BOOKINGS: 'tooManyPendingBookings',
  BOOKING_RATE_LIMIT_EXCEEDED: 'bookingRateLimitExceeded',
  TOO_MANY_PENDING_BOOST_PAYMENTS: 'tooManyPendingBoostPayments',
  BOOST_RATE_LIMIT_EXCEEDED: 'boostRateLimitExceeded',
};

// Traduit une erreur API en clé du namespace `toast.errors`, sans dépendre
// du message brut renvoyé par le backend (toujours en français).
export function getApiErrorMessageKey(error: unknown): ToastErrorKey {
  if (error instanceof ApiError) {
    if (error.code && CODE_TO_KEY[error.code]) {
      return CODE_TO_KEY[error.code];
    }
    if (error.status === 401) return 'invalidCredentials';
  }
  if (error instanceof TypeError) return 'network';
  return 'generic';
}
