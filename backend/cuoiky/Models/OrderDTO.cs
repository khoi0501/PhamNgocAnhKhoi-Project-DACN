using System.ComponentModel.DataAnnotations;

namespace cuoiky.Models;

public class CreateOrderDTO
{
    [Required]
    public string DiaChiGiaoHang { get; set; } = null!;
    
    [Required]
    public string PhuongThucThanhToan { get; set; } = null!;
    
    public string? MaGiamGia { get; set; }
    public string? HovaTen { get; set; }
    public string? SoDienThoai { get; set; }
}

public class OrderResponseDTO
{
    public long Id { get; set; }
    public string MaDonHang { get; set; } = null!;
    public string DiaChiGiaoHang { get; set; } = null!;
    public string PhuongThucThanhToan { get; set; } = null!;
    public decimal TongTien { get; set; }
    public decimal GiaTriGiam { get; set; }
    public decimal ThanhTien { get; set; }
    public string TrangThaiDonHang { get; set; } = null!;
    public DateTime NgayDat { get; set; }
    public DateTime? NgayGiao { get; set; } 
    public decimal PhiVanChuyen { get; set; }
    public string HovaTen { get; set; } = null!;
    public string SoDienThoai { get; set; } = null!;
    public string DiaChi { get; set; } = null!;
    public string TenTrangThaiThanhToan { get; set; } = null!;
    public List<OrderItemDTO> ChiTietDonHang { get; set; } = new List<OrderItemDTO>();
}

public class OrderItemDTO
{
    public long IdSach { get; set; }
    public string TenSach { get; set; } = null!;
    public string? HinhAnh { get; set; }
    public decimal Gia { get; set; }
    public int SoLuong { get; set; }
    public decimal ThanhTien { get; set; }
}

public class UserAddressDTO
{
    public string DiaChi { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? SoDienThoai { get; set; }
    public string? HovaTen { get; set; }
    public string? SoCCCD { get; set; }
}


