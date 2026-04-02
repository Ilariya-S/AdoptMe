const API_URL = process.env.REACT_APP_API_URL || "https://adoptme-api.onrender.com/api";

export interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
}

export async function apiCall(
  path: string,
  method: string = "GET",
  body: any = undefined,
  token?: string,
  signal?: AbortSignal | null
) {
  const url = `${API_URL}${path}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    signal,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
