namespace cuoiky.DTOs
{
    public class RegisterDTO
    {
        public string Email { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
        public string XacNhanMatKhau { get; set; } = string.Empty;

        // ✅ Các trường mới
        public string HovaTen { get; set; } = string.Empty;
        public string? SoDienThoai { get; set; }
        public string? DiaChi { get; set; }
        public string? SoCCCD { get; set; }
        public int IdChucVu { get; set; } // Chọn chức vụ từ bảng ChucVu

        // ✅ Danh sách phân quyền (có thể nhiều quyền)
        public List<PhanQuyenDTO>? PhanQuyens { get; set; }
    }

    public class PhanQuyenDTO
    {
        public int IdChucNang { get; set; } // ID chức năng từ bảng ChucNang
        public bool Quyen_Xem { get; set; }
        public bool Quyen_Them { get; set; }
        public bool Quyen_Sua { get; set; }
        public bool Quyen_Xoa { get; set; }
    }

}
