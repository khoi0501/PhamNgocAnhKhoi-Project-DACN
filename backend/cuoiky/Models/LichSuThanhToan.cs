using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("LichSuThanhToan")]
[Index("MaThanhToan", Name = "UQ__LichSuTh__D4B2584560662147", IsUnique = true)]
public partial class LichSuThanhToan
{
    [Key]
    public long Id { get; set; }

    [StringLength(200)]
    public string? MaThanhToan { get; set; }

    public long IdTaiKhoan { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal SoTien { get; set; }

    public int IdPhuongThucThanhToan { get; set; }

    public int TrangThaiId { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime NgayThanhToan { get; set; }

    public long? IdDonHang { get; set; }

    [ForeignKey("IdDonHang")]
    [InverseProperty("LichSuThanhToans")]
    public virtual DonHang? IdDonHangNavigation { get; set; }

    [ForeignKey("IdPhuongThucThanhToan")]
    [InverseProperty("LichSuThanhToans")]
    public virtual LoaiPhuongThucThanhToan IdPhuongThucThanhToanNavigation { get; set; } = null!;

    [ForeignKey("IdTaiKhoan")]
    [InverseProperty("LichSuThanhToans")]
    public virtual TaiKhoan IdTaiKhoanNavigation { get; set; } = null!;

    [ForeignKey("TrangThaiId")]
    [InverseProperty("LichSuThanhToans")]
    public virtual TrangThaiThanhToan TrangThai { get; set; } = null!;
}
