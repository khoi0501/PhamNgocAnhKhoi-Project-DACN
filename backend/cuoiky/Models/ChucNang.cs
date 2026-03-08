using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("ChucNang")]
[Index("MaChucNang", Name = "UQ__ChucNang__B26DC256948B0F40", IsUnique = true)]
public partial class ChucNang
{
    [Key]
    public int Id { get; set; }

    [StringLength(50)]
    public string MaChucNang { get; set; } = null!;

    [StringLength(100)]
    public string TenChucNang { get; set; } = null!;

    [StringLength(255)]
    public string? MoTa { get; set; }

    [InverseProperty("IdChucNangNavigation")]
    public virtual ICollection<PhanQuyenTaiKhoan> PhanQuyenTaiKhoans { get; set; } = new List<PhanQuyenTaiKhoan>();
}
