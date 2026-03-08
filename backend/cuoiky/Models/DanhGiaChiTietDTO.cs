using System;

namespace cuoiky.DTOs
{
    public class DanhGiaChiTietDTO
    {
        public long Id { get; set; }
        public long IdSach { get; set; }
        public string? TenSach { get; set; }
        public string? TenTaiKhoan { get; set; }
        public string? Email { get; set; }
        public int? SoSao { get; set; }
        public long? IdDonHang { get; set; }
        public string? NoiDung { get; set; }
        public DateTime? NgayDanhGia { get; set; }
        public DateOnly? NgayDatSach { get; set; }
    }
}



