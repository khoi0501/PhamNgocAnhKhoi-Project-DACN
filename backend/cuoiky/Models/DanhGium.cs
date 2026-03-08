using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

public partial class DanhGium
{
    [Key]
    public long Id { get; set; }

    public long IdTaiKhoan { get; set; }

    public int? SoSao { get; set; }

    public string? NoiDung { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? NgayDanhGia { get; set; }

    public long? IdSach { get; set; }

    public long? IdDonHang { get; set; }

    [ForeignKey("IdDonHang")]
    [InverseProperty("DanhGia")]
    public virtual DonHang? IdDonHangNavigation { get; set; }

    [ForeignKey("IdSach")]
    [InverseProperty("DanhGia")]
    public virtual Sach? IdSachNavigation { get; set; }

    [ForeignKey("IdTaiKhoan")]
    [InverseProperty("DanhGia")]
    public virtual TaiKhoan IdTaiKhoanNavigation { get; set; } = null!;
}
