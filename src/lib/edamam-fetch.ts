const EDAMAM_HEADERS = {
  "Edamam-Account-User": "mwfd-user",
};

export async function edamamFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...EDAMAM_HEADERS,
      ...options?.headers,
    },
  });
}
