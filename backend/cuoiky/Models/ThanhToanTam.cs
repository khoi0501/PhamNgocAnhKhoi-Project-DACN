using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("ThanhToan_Tam")]
public partial class ThanhToanTam
{
    [Key]
    public long Id { get; set; }

    public long? IdTaiKhoan { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? SoTien { get; set; }

    public long? IdDichVu { get; set; }

    public int? IdCongThanhToan { get; set; }

    [Column("idChiTietPhieuGiamGia")]
    public long? IdChiTietPhieuGiamGia { get; set; }
}
