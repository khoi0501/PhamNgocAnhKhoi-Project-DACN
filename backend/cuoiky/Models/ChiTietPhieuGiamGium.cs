using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

public partial class ChiTietPhieuGiamGium
{
    [Key]
    public int Id { get; set; }

    public long IdGiamGia { get; set; }

    public long IdTaiKhoan { get; set; }

    public DateOnly NgaySuDung { get; set; }

    [ForeignKey("IdGiamGia")]
    [InverseProperty("ChiTietPhieuGiamGia")]
    public virtual PhieuGiamGium IdGiamGiaNavigation { get; set; } = null!;

    [ForeignKey("IdTaiKhoan")]
    [InverseProperty("ChiTietPhieuGiamGia")]
    public virtual TaiKhoan IdTaiKhoanNavigation { get; set; } = null!;
}
