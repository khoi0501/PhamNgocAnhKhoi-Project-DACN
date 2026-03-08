namespace cuoiky.DTOs
{
    public class SachDTO
    {
        public long Id { get; set; }
        public string? TenSach { get; set; }
        public int? SoLuong { get; set; }
        public decimal? Gia { get; set; }
        public string? HinhAnh { get; set; }
        public string? MoTa { get; set; }
        public int? IdTheLoai { get; set; }
 

        public string? TenTacGia { get; set; }
        public string? TenNhaSanXuat { get; set; }
        public DateTime? NgaySanXuat { get; set; }
        public int? LuotXem { get; set; }   // ✅ Bổ sung trường này
    }
}
