using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("PhanQuyen_TaiKhoan")]
[Index("IdTaiKhoan", "IdChucNang", Name = "UQ_PhanQuyenTaiKhoan", IsUnique = true)]
public partial class PhanQuyenTaiKhoan
{
    [Key]
    public int Id { get; set; }

    public long IdTaiKhoan { get; set; }

    [Column("Quyen_Xem")]
    public bool? QuyenXem { get; set; }

    [Column("Quyen_Them")]
    public bool? QuyenThem { get; set; }

    [Column("Quyen_Sua")]
    public bool? QuyenSua { get; set; }

    [Column("Quyen_Xoa")]
    public bool? QuyenXoa { get; set; }

    public int? IdChucNang { get; set; }

    [ForeignKey("IdChucNang")]
    [InverseProperty("PhanQuyenTaiKhoans")]
    public virtual ChucNang? IdChucNangNavigation { get; set; }

    [ForeignKey("IdTaiKhoan")]
    [InverseProperty("PhanQuyenTaiKhoans")]
    public virtual TaiKhoan IdTaiKhoanNavigation { get; set; } = null!;
}
