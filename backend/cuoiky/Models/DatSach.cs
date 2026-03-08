using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("DatSach")]
public partial class DatSach
{
    [Key]
    public long Id { get; set; }

    public long? IdSach { get; set; }

    public long? IdTaiKhoan { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? NgayDat { get; set; }

    [ForeignKey("IdSach")]
    [InverseProperty("DatSaches")]
    public virtual Sach? IdSachNavigation { get; set; }

    [ForeignKey("IdTaiKhoan")]
    [InverseProperty("DatSaches")]
    public virtual TaiKhoan? IdTaiKhoanNavigation { get; set; }
}
