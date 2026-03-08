using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

[Table("TonKho")]
public partial class TonKho
{
    [Key]
    public long Id { get; set; }

    public long? IdSach { get; set; }

    public int? SoLuong { get; set; }

    [ForeignKey("IdSach")]
    [InverseProperty("TonKhos")]
    public virtual Sach? IdSachNavigation { get; set; }
}
