using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("TheLoai")]
public partial class TheLoai
{
    [Key]
    public int Id { get; set; }

    [StringLength(50)]
    public string TenTheLoai { get; set; } = null!;

    [InverseProperty("IdTheLoaiNavigation")]
    public virtual ICollection<NhapHang> NhapHangs { get; set; } = new List<NhapHang>();

    [InverseProperty("IdTheLoaiNavigation")]
    public virtual ICollection<Sach> Saches { get; set; } = new List<Sach>();
}
