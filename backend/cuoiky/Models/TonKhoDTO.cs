namespace cuoiky.DTOs
{
    // ✅ DTO cho danh sách tồn kho
    public class TonKhoDTO
    {
        public long Id { get; set; }
        public long? IdSach { get; set; }
        public string? TenSach { get; set; }
        public string? TenTheLoai { get; set; }
        public string? HinhAnh { get; set; }
        public string? TenTacGia { get; set; }
        public string? TenNhaSanXuat { get; set; }
        public DateTime? NgaySanXuat { get; set; }
        public int? SoLuong { get; set; }
    }

    // ✅ DTO cho request xuất kho
    public class XuatKhoDTO
    {
        public long IdTonKho { get; set; }
        public int SoLuongXuat { get; set; }
    }
}





