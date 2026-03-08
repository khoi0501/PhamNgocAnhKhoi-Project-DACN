using System.ComponentModel.DataAnnotations;

namespace cuoiky.Models;

public class CreatePhieuGiamGiaDTO
{
    [Required]
    [StringLength(20, ErrorMessage = "Mã giảm giá không được quá 20 ký tự")]
    public string MaGiamGia { get; set; } = null!;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Giá trị giảm phải lớn hơn 0")]
    public decimal GiaTriGiam { get; set; }

    [Required]
    public DateTime NgayKetThuc { get; set; }

    [StringLength(20)]
    public string? LoaiPhieuGiamGia { get; set; }

    [StringLength(50)]
    public string? DieuKienGiamGia { get; set; }

    [StringLength(100)]
    public string? NoiDung { get; set; }
}

public class PhieuGiamGiaResponseDTO
{
    public long Id { get; set; }
    public string MaGiamGia { get; set; } = null!;
    public decimal GiaTriGiam { get; set; }
    public DateTime NgayKetThuc { get; set; }
    public string? LoaiPhieuGiamGia { get; set; }
    public string? DieuKienGiamGia { get; set; }
    public string? NoiDung { get; set; }
    public bool IsValid { get; set; }
    public int DaysRemaining { get; set; }
}

public class ApplyPhieuGiamGiaDTO
{
    [Required]
    public string MaGiamGia { get; set; } = null!;
    
    public decimal TongTienDonHang { get; set; }
    public decimal? PhiVanChuyen { get; set; }
}

















