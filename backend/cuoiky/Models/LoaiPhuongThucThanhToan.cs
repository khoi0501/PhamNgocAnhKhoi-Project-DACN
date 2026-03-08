using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("LoaiPhuongThucThanhToan")]
public partial class LoaiPhuongThucThanhToan
{
    [Key]
    public int Id { get; set; }

    [StringLength(100)]
    public string TenPhuongThuc { get; set; } = null!;

    [InverseProperty("IdPhuongThucThanhToanNavigation")]
    public virtual ICollection<LichSuThanhToan> LichSuThanhToans { get; set; } = new List<LichSuThanhToan>();
}
