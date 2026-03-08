using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("TrangThaiThanhToan")]
public partial class TrangThaiThanhToan
{
    [Key]
    public int Id { get; set; }

    [StringLength(50)]
    public string TenTrangThai { get; set; } = null!;

    [InverseProperty("TrangThai")]
    public virtual ICollection<LichSuThanhToan> LichSuThanhToans { get; set; } = new List<LichSuThanhToan>();
}
