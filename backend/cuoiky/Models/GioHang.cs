using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("GioHang")]
public partial class GioHang
{
    [Key]
    public long Id { get; set; }

    public long? IdTaiKhoan { get; set; }

    [InverseProperty("IdGioHangNavigation")]
    public virtual ICollection<ChiTietGioHang> ChiTietGioHangs { get; set; } = new List<ChiTietGioHang>();

    [ForeignKey("IdTaiKhoan")]
    [InverseProperty("GioHangs")]
    public virtual TaiKhoan? IdTaiKhoanNavigation { get; set; }
}
