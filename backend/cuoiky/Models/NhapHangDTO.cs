namespace cuoiky.DTOs
{
    // ✅ DTO cho tạo/cập nhật nhập hàng
    public class NhapHangDTO
    {
        public long Id { get; set; }
        public int? IdTheLoai { get; set; }
        public string? TenSach { get; set; }
        public int? SoLuongNhap { get; set; }
        public decimal? GiaNhap { get; set; }
        public long? IdTaiKhoan { get; set; }
        public DateTime? NgayNhap { get; set; }
    }

    // ✅ DTO cho response nhập hàng (có thêm thông tin tài khoản và thể loại)
    public class NhapHangResponseDTO
    {
        public long Id { get; set; }
        public int? IdTheLoai { get; set; }
        public string? TenTheLoai { get; set; }
        public string? TenSach { get; set; }
        public int? SoLuongNhap { get; set; }
        public decimal? GiaNhap { get; set; }
        public long? IdTaiKhoan { get; set; }
        public string? TenTaiKhoan { get; set; }
        public string? EmailTaiKhoan { get; set; }
        public DateTime? NgayNhap { get; set; }
        public decimal? ThanhTien { get; set; } // SoLuongNhap * GiaNhap
        public int? TonKhoBanDau { get; set; }
    }
}








