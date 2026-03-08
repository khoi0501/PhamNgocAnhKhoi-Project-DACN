using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("TrangThaiDonHang")]
public partial class TrangThaiDonHang
{
    [Key]
    public int Id { get; set; }

    [StringLength(100)]
    public string TenTrangThai { get; set; } = null!;

    [InverseProperty("IdTrangThaiDonHangNavigation")]
    public virtual ICollection<DonHang> DonHangs { get; set; } = new List<DonHang>();
}
