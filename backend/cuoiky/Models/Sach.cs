using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("Sach")]
public partial class Sach
{
    [Key]
    public long Id { get; set; }

    [StringLength(255)]
    public string? TenSach { get; set; }

    public int? SoLuong { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? Gia { get; set; }

    public string? HinhAnh { get; set; }

    [StringLength(255)]
    public string? MoTa { get; set; }

    public int? IdTheLoai { get; set; }

    [StringLength(255)]
    public string? TenTacGia { get; set; }

    [StringLength(255)]
    public string? TenNhaSanXuat { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? NgaySanXuat { get; set; }

    public int? LuotXem { get; set; }

    [InverseProperty("IdSachNavigation")]
    public virtual ICollection<ChiTietDonHang> ChiTietDonHangs { get; set; } = new List<ChiTietDonHang>();

    [InverseProperty("IdSachNavigation")]
    public virtual ICollection<ChiTietGioHang> ChiTietGioHangs { get; set; } = new List<ChiTietGioHang>();

    [InverseProperty("IdSachNavigation")]
    public virtual ICollection<DanhGium> DanhGia { get; set; } = new List<DanhGium>();

    [InverseProperty("IdSachNavigation")]
    public virtual ICollection<DatSach> DatSaches { get; set; } = new List<DatSach>();

    [ForeignKey("IdTheLoai")]
    [InverseProperty("Saches")]
    public virtual TheLoai? IdTheLoaiNavigation { get; set; }

    [InverseProperty("IdSachNavigation")]
    public virtual ICollection<TonKho> TonKhos { get; set; } = new List<TonKho>();
}
