using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("ChiTietDonHang")]
public partial class ChiTietDonHang
{
    [Key]
    public long Id { get; set; }

    public long? IdDonHang { get; set; }

    public long? IdSach { get; set; }

    public int? SoLuong { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? Gia { get; set; }

    [ForeignKey("IdDonHang")]
    [InverseProperty("ChiTietDonHangs")]
    public virtual DonHang? IdDonHangNavigation { get; set; }

    [ForeignKey("IdSach")]
    [InverseProperty("ChiTietDonHangs")]
    public virtual Sach? IdSachNavigation { get; set; }
}
