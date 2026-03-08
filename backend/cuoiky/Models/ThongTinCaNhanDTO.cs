using System.ComponentModel.DataAnnotations;

namespace cuoiky.Models;

public class ThongTinCaNhanDTO
{
    [Required]
    public string HovaTen { get; set; } = null!;

    [Required]
    [RegularExpression("^\\d{10}$", ErrorMessage = "Số điện thoại phải gồm 10 chữ số")]
    public string SoDienThoai { get; set; } = null!;

    [Required]
    [RegularExpression("^\\d{12}$", ErrorMessage = "Số CCCD phải gồm 12 chữ số")]
    public string SoCCCD { get; set; } = null!;

    // Địa chỉ: người dùng nhập số nhà (free text), phường và thành phố là dropdown phía client
    [Required]
    public string DiaChi { get; set; } = null!; // e.g., "123, Phường X, Quận Y, Thành phố Z"
}


