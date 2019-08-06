type BackendErrorType = 'error' | 'warning';

export type BackendError = {
  type: BackendErrorType;
  message: string;
};

export type BackendResponse<T> =
  | Promise<{ data: T; error?: never }>
  | Promise<{ data?: never; error: BackendError }>;
