namespace cuoiky.Models
{
    // ✅ DTO cho kết quả tìm kiếm sách
    public class SearchResultDTO
    {
        public long Id { get; set; }
        public string TenSach { get; set; } = "";
        public string TacGia { get; set; } = "";
        public decimal Gia { get; set; }
        public string HinhAnh { get; set; } = "";
        public int SoLuong { get; set; }
        public int LuotXem { get; set; }
        public string MoTa { get; set; } = "";

        public string TenNhaSanXuat { get; set; } = "";
        public DateTime? NgaySanXuat { get; set; }
        public int IdTheLoai { get; set; }
    }

    
}









