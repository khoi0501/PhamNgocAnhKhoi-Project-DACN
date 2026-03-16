import { BASE_URL, authFetch } from './api';

export interface SachDTO {
  id: number;
  tenSach?: string;
  soLuong?: number;
  gia?: number;
  hinhAnh?: string;
  moTa?: string;
  idTheLoai?: number;
  tenTacGia?: string;
  tenNhaSanXuat?: string;
  ngaySanXuat?: string;
  luotXem?: number;
}

export const getSachList = async (): Promise<SachDTO[]> => {
  try {
    const res = await authFetch(`${BASE_URL}/api/Sach/LayDanhSach`);
    const json = await res.json();
    if (json.statusCode === 200) {
      return json.data as SachDTO[];
    }
    return [];
  } catch (e) {
    console.error('getSachList error:', e);
    return [];
  }
};
