export const API_BASE_URL = '';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  let token = localStorage.getItem('nexus_access_token') || sessionStorage.getItem('nexus_access_token');
  
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const signal = options.signal || controller.signal;

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 401 && token) {
      const refreshToken = localStorage.getItem('nexus_refresh_token') || sessionStorage.getItem('nexus_refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            token = data.access_token;
            
            if (localStorage.getItem('nexus_access_token')) {
              localStorage.setItem('nexus_access_token', token as string);
              localStorage.setItem('nexus_refresh_token', data.refresh_token);
            } else {
              sessionStorage.setItem('nexus_access_token', token as string);
              sessionStorage.setItem('nexus_refresh_token', data.refresh_token);
            }

            headers.set('Authorization', `Bearer ${token}`);
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
          } else {
            localStorage.removeItem('nexus_access_token');
            localStorage.removeItem('nexus_refresh_token');
            sessionStorage.removeItem('nexus_access_token');
            sessionStorage.removeItem('nexus_refresh_token');
            window.dispatchEvent(new Event('auth:unauthorized'));
          }
        } catch (err) {
          console.error('Failed to refresh token', err);
        }
      } else {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'API request failed');
    }

    if (response.status === 204) {
      return true;
    }

    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : {};
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err && (err.name === 'AbortError' || err.message?.includes('abort') || err.message?.includes('aborted'))) {
      throw new Error('Network request timed out. Please retry.');
    }
    throw err;
  }
}
