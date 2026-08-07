export const encodeShareData = (type: 'track' | 'playlist' | 'favorites', data: any, name?: string): string => {
  const payload = { type, data, name };
  const str = JSON.stringify(payload);
  const encoded = btoa(encodeURIComponent(str));
  return encoded;
};

export const decodeShareData = (encoded: string): any => {
  try {
    const str = decodeURIComponent(atob(encoded));
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

export const generateShareLink = (type: 'track' | 'playlist' | 'favorites', data: any, name?: string): string => {
  const encoded = encodeShareData(type, data, name);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?share=${encoded}`;
};
