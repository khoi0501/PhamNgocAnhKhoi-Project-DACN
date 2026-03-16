import AsyncStorage from '@react-native-async-storage/async-storage';

// Đổi thành IP máy thật nếu chạy trên điện thoại thật
// export const BASE_URL = 'http://192.168.x.x:5234';
export const BASE_URL = 'https://lambently-nonenunciative-tashia.ngrok-free.dev'; 

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('token');
};

export const setToken = async (token: string) => {
  await AsyncStorage.setItem('token', token);
};

export const removeToken = async () => {
  await AsyncStorage.removeItem('token');
};

export const setIsAdmin = async (isAdmin: boolean) => {
  await AsyncStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
};

export const getIsAdmin = async (): Promise<boolean> => {
  const val = await AsyncStorage.getItem('isAdmin');
  return val === 'true';
};

export const setPermissions = async (perms: any[]) => {
  await AsyncStorage.setItem('permissions', JSON.stringify(perms));
};

export const getPermissions = async (): Promise<any[]> => {
  const val = await AsyncStorage.getItem('permissions');
  return val ? JSON.parse(val) : [];
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = await getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(options.headers || {}),
    },
  });
};

export const findPermission = (perms: any[], config: { exact?: string[], matches?: string[], avoid?: string[] }) => {
  for (const p of perms) {
    const t = (p.tenChucNang || '').toLowerCase().trim();
    if (config.avoid && config.avoid.some(a => t.includes(a))) continue;
    if (config.exact && config.exact.includes(t)) return p;
    if (config.matches && config.matches.some(m => t.includes(m) || m.includes(t))) return p;
  }
  return null;
};
