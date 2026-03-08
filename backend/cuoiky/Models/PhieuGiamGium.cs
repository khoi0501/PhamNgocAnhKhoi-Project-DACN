using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Index("MaGiamGia", Name = "UQ__PhieuGia__EF9458E5971D731F", IsUnique = true)]
public partial class PhieuGiamGium
{
    [Key]
    public long Id { get; set; }

    [StringLength(20)]
    [Unicode(false)]
    public string MaGiamGia { get; set; } = null!;

    [Column(TypeName = "decimal(10, 2)")]
    public decimal GiaTriGiam { get; set; }

    public DateOnly NgayKetThuc { get; set; }

    [StringLength(20)]
    public string? LoaiPhieuGiamGia { get; set; }

    [StringLength(50)]
    public string? DieuKienGiamGia { get; set; }

    [StringLength(100)]
    public string? NoiDung { get; set; }

    [InverseProperty("IdGiamGiaNavigation")]
    public virtual ICollection<ChiTietPhieuGiamGium> ChiTietPhieuGiamGia { get; set; } = new List<ChiTietPhieuGiamGium>();
}
