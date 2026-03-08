using System.ComponentModel.DataAnnotations;

namespace cuoiky.Models;

public class AddToCartDTO
{
    [Required]
    public long IdSach { get; set; }
    
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
    public int SoLuong { get; set; }
}

public class UpdateCartItemDTO
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
    public int SoLuong { get; set; }
}

public class CartItemDTO
{
    public long Id { get; set; }
    public long IdSach { get; set; }
    public string? TenSach { get; set; }
    public string? HinhAnh { get; set; }
    public decimal? Gia { get; set; }
    public int? SoLuong { get; set; }
    public decimal? ThanhTien => Gia * SoLuong;
}

public class CartResponseDTO
{
    public List<CartItemDTO> Items { get; set; } = new List<CartItemDTO>();
    public decimal? TongTien => Items.Sum(item => item.ThanhTien ?? 0);
    public int TongSoLuong => Items.Sum(item => item.SoLuong ?? 0);
}






























