const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function request<T = any>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  isMultipart = false
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!isMultipart && body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = path.startsWith('/api') ? path : `${BASE_URL}${path}`;

  const res = await fetch(endpoint, {
    method,
    headers,
    body: isMultipart ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return {} as T;
  }

  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new ApiError('The server is currently starting up or restarting. Please try again in a few moments.', res.status);
    }
    let errorMsg = json.message || json.error || `Request failed with status ${res.status}`;
    if (typeof errorMsg === 'string' && errorMsg.trim().startsWith('<')) {
      errorMsg = `Server returned an error (${res.status}). Please try again in a few moments.`;
    }
    throw new ApiError(errorMsg, res.status, json);
  }

  return json as T;
}

export function cleanPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return '234' + digits.substring(1);
  }
  return digits;
}
