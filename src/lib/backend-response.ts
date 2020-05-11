export type BackendError = {
  type: 'error';
  message: string;
};

export type BackendWarning = {
  type: 'warning';
  message: string;
};

export type BackendResponse<T> =
  | Promise<{ data: T; error?: never; warning?: BackendWarning[] }>
  | Promise<{ data?: never; error: BackendError[] }>;
