using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("ChucVu")]
public partial class ChucVu
{
    [Key]
    public int Id { get; set; }

    [StringLength(50)]
    public string TenChucVu { get; set; } = null!;

    [InverseProperty("IdChucVuNavigation")]
    public virtual ICollection<TaiKhoan> TaiKhoans { get; set; } = new List<TaiKhoan>();
}
