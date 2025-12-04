// In local development with Next.js API routes, we don't need a separate gateway URL
// If BASE_URL is empty, requests will go to the current origin (which is what we want)
const BASE_URL = process.env.NEXT_PUBLIC_BE_GATEWAY || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const req = {
  async post<T = any>(endpoint: string, data: unknown): Promise<T> {
    console.log(`Making POST request to: ${endpoint}`);
    console.log('Request payload:', data);

    // Check specifically for userId in chat save requests
    if (endpoint === '/api/ai/chat/save' && typeof data === 'object' && data !== null) {
      const payload = data as any;
      console.log('Chat save payload check - projectId:', payload.projectId);
      console.log('Chat save payload check - userId:', payload.userId);
      console.log('Chat save payload keys:', Object.keys(payload));
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error(`HTTP Error ${response.status}: ${response.statusText} for ${endpoint}`);
        const errorText = await response.text().catch(() => 'No response text');
        console.error('Response text:', errorText);
        throw { response: { data: { error: `HTTP ${response.status}: ${response.statusText}`, details: errorText } } };
      }

      const result = await response.json();
      console.log(`Success response from ${endpoint}:`, result);
      return result as T;
    } catch (error) {
      console.error(`Error in POST request to ${endpoint}:`, error);
      throw error;
    }
  },

  async get<T = any>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw { response: { data: { error: `HTTP ${response.status}: ${response.statusText}` } } };
    }

    return await response.json() as T;
  },

  async put<T = any>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw { response: { data: { error: `HTTP ${response.status}: ${response.statusText}` } } };
    }

    return await response.json() as T;
  }
};
