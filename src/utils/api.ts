export interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
}

export async function apiCall(
  path: string,
  method: string = "GET",
  body: any = undefined,
  token?: string
) {
  // Этот адаптер для stub api, при необходимости заменить на реальный endpoint.
  if (path === "/pets" && method === "GET") {
    return [];
  }

  if (method === "DELETE") {
    return { success: true };
  }

  // Для других вызовов просто возвращаем пустое значение
  return null;
}
