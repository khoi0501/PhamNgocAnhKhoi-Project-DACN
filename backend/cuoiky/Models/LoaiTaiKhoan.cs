using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("LoaiTaiKhoan")]
public partial class LoaiTaiKhoan
{
    [Key]
    public int Id { get; set; }

    [StringLength(50)]
    public string TenLoai { get; set; } = null!;

    [InverseProperty("LoaiTaiKhoan")]
    public virtual ICollection<TaiKhoan> TaiKhoans { get; set; } = new List<TaiKhoan>();
}
