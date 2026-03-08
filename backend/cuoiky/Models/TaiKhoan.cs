using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("TaiKhoan")]
public partial class TaiKhoan
{
    [Key]
    public long Id { get; set; }

    [StringLength(255)]
    public string? HovaTen { get; set; }

    [StringLength(255)]
    public string Email { get; set; } = null!;

    [StringLength(20)]
    public string? SoDienThoai { get; set; }

    [StringLength(255)]
    [Unicode(false)]
    public string MatKhau { get; set; } = null!;

    public int? LoaiTaiKhoanId { get; set; }

    public string? DiaChi { get; set; }

    public int? SoLanNhapSaiMatKhau { get; set; }

    [Column("SoCCCD")]
    [StringLength(30)]
    public string? SoCccd { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? ThoiGianKhoaMatKhau { get; set; }

    public bool? IsAdmin { get; set; }

    public int? IdChucVu { get; set; }

    [StringLength(10)]
    public string? EmailCode { get; set; }

    [InverseProperty("IdTaiKhoanNavigation")]
    public virtual ICollection<ChiTietPhieuGiamGium> ChiTietPhieuGiamGia { get; set; } = new List<ChiTietPhieuGiamGium>();

    [InverseProperty("IdTaiKhoanNavigation")]
    public virtual ICollection<DanhGium> DanhGia { get; set; } = new List<DanhGium>();

    [InverseProperty("IdTaiKhoanNavigation")]
    public virtual ICollection<DatSach> DatSaches { get; set; } = new List<DatSach>();

    [InverseProperty("IdTaiKhoanNavigation")]
    public virtual ICollection<DonHang> DonHangs { get; set; } = new List<DonHang>();

    [InverseProperty("IdTaiKhoanNavigation")]
    public virtual ICollection<GioHang> GioHangs { get; set; } = new List<GioHang>();

    [ForeignKey("IdChucVu")]
    [InverseProperty("TaiKhoans")]
    public virtual ChucVu? IdChucVuNavigation { get; set; }

    [InverseProperty("IdTaiKhoanNavigation")]
    public virtual ICollection<LichSuThanhToan> LichSuThanhToans { get; set; } = new List<LichSuThanhToan>();

    [ForeignKey("LoaiTaiKhoanId")]
    [InverseProperty("TaiKhoans")]
    public virtual LoaiTaiKhoan? LoaiTaiKhoan { get; set; }

    [InverseProperty("IdTaiKhoanNavigation")]
    public virtual ICollection<NhapHang> NhapHangs { get; set; } = new List<NhapHang>();

    [InverseProperty("IdTaiKhoanNavigation")]
    public virtual ICollection<PhanQuyenTaiKhoan> PhanQuyenTaiKhoans { get; set; } = new List<PhanQuyenTaiKhoan>();
}
