namespace cuoiky.DTOs
{
    // DTO để hiển thị thông tin admin
    public class AdminDTO
    {
        public long Id { get; set; }
        public string Email { get; set; } = null!;
        public string MatKhau { get; set; } = null!;
        public string? HovaTen { get; set; }
        public string? SoDienThoai { get; set; }
        public string? DiaChi { get; set; }
        public string? SoCCCD { get; set; }
        public int? IdChucVu { get; set; }
    }

    public class PhanQuyenRequestDTO
    {
        public int IdChucNang { get; set; }
        public bool? QuyenXem { get; set; }
        public bool? QuyenThem { get; set; }
        public bool? QuyenSua { get; set; }
        public bool? QuyenXoa { get; set; }
    }

    // DTO để cập nhật thông tin admin
    public class UpdateAdminDTO
    {
        public string? Email { get; set; }
        public string? MatKhau { get; set; }
        public string? HovaTen { get; set; }
        public string? SoDienThoai { get; set; }
        public string? DiaChi { get; set; }
        public string? SoCCCD { get; set; }
        public int? IdChucVu { get; set; }
        public List<PhanQuyenRequestDTO>? PhanQuyens { get; set; }
        public List<int>? XoaPhanQuyens { get; set; }
    }
}


