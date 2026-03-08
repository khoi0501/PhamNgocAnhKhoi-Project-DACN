using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("NhapHang")]
public partial class NhapHang
{
    [Key]
    public long Id { get; set; }

    public int? IdTheLoai { get; set; }

    [StringLength(255)]
    public string? TenSach { get; set; }

    public int? SoLuongNhap { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? GiaNhap { get; set; }

    public long? IdTaiKhoan { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? NgayNhap { get; set; }

    public int? TonKhoBanDau { get; set; }

    [ForeignKey("IdTaiKhoan")]
    [InverseProperty("NhapHangs")]
    public virtual TaiKhoan? IdTaiKhoanNavigation { get; set; }

    [ForeignKey("IdTheLoai")]
    [InverseProperty("NhapHangs")]
    public virtual TheLoai? IdTheLoaiNavigation { get; set; }
}
