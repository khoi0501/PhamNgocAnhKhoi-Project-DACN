using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("DonHang")]
public partial class DonHang
{
    [Key]
    public long Id { get; set; }

    [StringLength(30)]
    [Unicode(false)]
    public string MaDonHang { get; set; } = null!;

    public int? IdTrangThaiDonHang { get; set; }

    public long IdTaiKhoan { get; set; }

    public DateOnly? NgayDat { get; set; }

    public DateOnly? NgayGiao { get; set; }

    [StringLength(255)]
    public string? DiaChiGiaoHang { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? TongTien { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal GiaTriGiam { get; set; }

    [StringLength(255)]
    public string? HovaTen { get; set; }

    [StringLength(20)]
    public string? SoDienThoai { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal PhiVanChuyen { get; set; }

    [InverseProperty("IdDonHangNavigation")]
    public virtual ICollection<ChiTietDonHang> ChiTietDonHangs { get; set; } = new List<ChiTietDonHang>();

    [InverseProperty("IdDonHangNavigation")]
    public virtual ICollection<DanhGium> DanhGia { get; set; } = new List<DanhGium>();

    [ForeignKey("IdTaiKhoan")]
    [InverseProperty("DonHangs")]
    public virtual TaiKhoan IdTaiKhoanNavigation { get; set; } = null!;

    [ForeignKey("IdTrangThaiDonHang")]
    [InverseProperty("DonHangs")]
    public virtual TrangThaiDonHang? IdTrangThaiDonHangNavigation { get; set; }

    [InverseProperty("IdDonHangNavigation")]
    public virtual ICollection<LichSuThanhToan> LichSuThanhToans { get; set; } = new List<LichSuThanhToan>();
}
