using System.ComponentModel.DataAnnotations;

namespace cuoiky.Models;

public class CreateReviewDTO
{
    [Required]
    public long IdSach { get; set; }
    [Required(ErrorMessage = "IdDonHang là bắt buộc")]
    public long IdDonHang { get; set; }

    [Required]
    [Range(1, 5, ErrorMessage = "Số sao phải từ 1 đến 5")]
    public int SoSao { get; set; }
    
    [Required]
    [StringLength(500, ErrorMessage = "Nội dung đánh giá không được quá 500 ký tự")]
    public string NoiDung { get; set; } = null!;
}

public class ReviewResponseDTO
{
    public long Id { get; set; }
    public long IdTaiKhoan { get; set; }
    public string Email { get; set; } = null!;
    public int? SoSao { get; set; }
    public string? NoiDung { get; set; }
    public DateTime? NgayDanhGia { get; set; }
}

public class BookReviewSummaryDTO
{
    public long IdSach { get; set; }
    public string? TenSach { get; set; }
    public double? DiemTrungBinh { get; set; }
    public int TongSoDanhGia { get; set; }
    public List<ReviewResponseDTO> DanhSachDanhGia { get; set; } = new List<ReviewResponseDTO>();
}





























