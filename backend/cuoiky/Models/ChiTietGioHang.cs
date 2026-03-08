using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("ChiTietGioHang")]
public partial class ChiTietGioHang
{
    [Key]
    public long Id { get; set; }

    public long? IdGioHang { get; set; }

    public long? IdSach { get; set; }

    public int? SoLuong { get; set; }

    public string? HinhAnh { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? Gia { get; set; }

    [ForeignKey("IdGioHang")]
    [InverseProperty("ChiTietGioHangs")]
    public virtual GioHang? IdGioHangNavigation { get; set; }

    [ForeignKey("IdSach")]
    [InverseProperty("ChiTietGioHangs")]
    public virtual Sach? IdSachNavigation { get; set; }
}
