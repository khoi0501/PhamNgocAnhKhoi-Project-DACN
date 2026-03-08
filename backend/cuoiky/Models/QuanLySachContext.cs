using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Models;

public partial class QuanLySachContext : DbContext
{
    public QuanLySachContext()
    {
    }

    public QuanLySachContext(DbContextOptions<QuanLySachContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ChiTietDonHang> ChiTietDonHangs { get; set; }

    public virtual DbSet<ChiTietGioHang> ChiTietGioHangs { get; set; }

    public virtual DbSet<ChiTietPhieuGiamGium> ChiTietPhieuGiamGia { get; set; }

    public virtual DbSet<ChucNang> ChucNangs { get; set; }

    public virtual DbSet<ChucVu> ChucVus { get; set; }

    public virtual DbSet<DanhGium> DanhGia { get; set; }

    public virtual DbSet<DatSach> DatSaches { get; set; }

    public virtual DbSet<DonHang> DonHangs { get; set; }

    public virtual DbSet<GioHang> GioHangs { get; set; }

    public virtual DbSet<LichSuThanhToan> LichSuThanhToans { get; set; }

    public virtual DbSet<LoaiPhuongThucThanhToan> LoaiPhuongThucThanhToans { get; set; }

    public virtual DbSet<LoaiTaiKhoan> LoaiTaiKhoans { get; set; }

    public virtual DbSet<NhapHang> NhapHangs { get; set; }

    public virtual DbSet<PhanQuyenTaiKhoan> PhanQuyenTaiKhoans { get; set; }

    public virtual DbSet<PhieuGiamGium> PhieuGiamGia { get; set; }

    public virtual DbSet<Sach> Saches { get; set; }

    public virtual DbSet<TaiKhoan> TaiKhoans { get; set; }

    public virtual DbSet<ThanhToanTam> ThanhToanTams { get; set; }

    public virtual DbSet<TheLoai> TheLoais { get; set; }

    public virtual DbSet<TonKho> TonKhos { get; set; }

    public virtual DbSet<TrangThaiDonHang> TrangThaiDonHangs { get; set; }

    public virtual DbSet<TrangThaiThanhToan> TrangThaiThanhToans { get; set; }

  

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChiTietDonHang>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChiTietD__3214EC07AC889BDF");

            entity.HasOne(d => d.IdDonHangNavigation).WithMany(p => p.ChiTietDonHangs).HasConstraintName("FK__ChiTietDo__IdDon__4BAC3F29");

            entity.HasOne(d => d.IdSachNavigation).WithMany(p => p.ChiTietDonHangs).HasConstraintName("FK__ChiTietDo__IdSac__4CA06362");
        });

        modelBuilder.Entity<ChiTietGioHang>(entity =>
        {
            entity.HasOne(d => d.IdGioHangNavigation).WithMany(p => p.ChiTietGioHangs).HasConstraintName("FK__ChiTietGi__IdGio__628FA481");

            entity.HasOne(d => d.IdSachNavigation).WithMany(p => p.ChiTietGioHangs).HasConstraintName("FK__ChiTietGi__IdSac__619B8048");
        });

        modelBuilder.Entity<ChiTietPhieuGiamGium>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChiTietP__3214EC07DA303DB7");

            entity.HasOne(d => d.IdGiamGiaNavigation).WithMany(p => p.ChiTietPhieuGiamGia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ChiTietPh__IdGia__52593CB8");

            entity.HasOne(d => d.IdTaiKhoanNavigation).WithMany(p => p.ChiTietPhieuGiamGia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ChiTietPh__IdTai__534D60F1");
        });

        modelBuilder.Entity<ChucNang>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChucNang__3214EC07F15E9ACA");
        });

        modelBuilder.Entity<ChucVu>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChucVu__3214EC07C2FD8A17");
        });

        modelBuilder.Entity<DanhGium>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DanhGia__3214EC07B12BEE34");

            entity.HasOne(d => d.IdDonHangNavigation).WithMany(p => p.DanhGia).HasConstraintName("FK_DanhGia_DonHang");

            entity.HasOne(d => d.IdSachNavigation).WithMany(p => p.DanhGia)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_DanhGia_Sach");

            entity.HasOne(d => d.IdTaiKhoanNavigation).WithMany(p => p.DanhGia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DanhGia__IdTaiKh__5629CD9C");
        });

        modelBuilder.Entity<DatSach>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DatSach__3214EC07AB783283");

            entity.HasOne(d => d.IdSachNavigation).WithMany(p => p.DatSaches).HasConstraintName("FK__DatSach__IdSach__398D8EEE");

            entity.HasOne(d => d.IdTaiKhoanNavigation).WithMany(p => p.DatSaches).HasConstraintName("FK__DatSach__NgayDat__38996AB5");
        });

        modelBuilder.Entity<DonHang>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DonHang__3214EC079BCBE66A");

            entity.HasOne(d => d.IdTaiKhoanNavigation).WithMany(p => p.DonHangs)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DonHang__IdTaiKh__47DBAE45");

            entity.HasOne(d => d.IdTrangThaiDonHangNavigation).WithMany(p => p.DonHangs).HasConstraintName("FK__DonHang__IdTrang__48CFD27E");
        });

        modelBuilder.Entity<GioHang>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__GioHang__3214EC072CD3F372");

            entity.HasOne(d => d.IdTaiKhoanNavigation).WithMany(p => p.GioHangs).HasConstraintName("FK__GioHang__IdTaiKh__5FB337D6");
        });

        modelBuilder.Entity<LichSuThanhToan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__LichSuTh__3214EC07981C25FA");

            entity.HasOne(d => d.IdDonHangNavigation).WithMany(p => p.LichSuThanhToans)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_LichSuThanhToan_DonHang");

            entity.HasOne(d => d.IdPhuongThucThanhToanNavigation).WithMany(p => p.LichSuThanhToans)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__LichSuTha__IdPhu__4316F928");

            entity.HasOne(d => d.IdTaiKhoanNavigation).WithMany(p => p.LichSuThanhToans)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__LichSuTha__IdTai__412EB0B6");

            entity.HasOne(d => d.TrangThai).WithMany(p => p.LichSuThanhToans)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__LichSuTha__Trang__4222D4EF");
        });

        modelBuilder.Entity<LoaiPhuongThucThanhToan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__LoaiPhuo__3214EC079DEBF89D");
        });

        modelBuilder.Entity<LoaiTaiKhoan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__LoaiTaiK__3214EC07390C558E");
        });

        modelBuilder.Entity<NhapHang>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__NhapHang__3214EC07FC43F125");

            entity.HasOne(d => d.IdTaiKhoanNavigation).WithMany(p => p.NhapHangs).HasConstraintName("FK__NhapHang__NgayNh__59063A47");

            entity.HasOne(d => d.IdTheLoaiNavigation).WithMany(p => p.NhapHangs).HasConstraintName("FK__NhapHang__IdTheL__59FA5E80");
        });

        modelBuilder.Entity<PhanQuyenTaiKhoan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PhanQuye__3214EC07C1060D5E");

            entity.Property(e => e.QuyenSua).HasDefaultValue(false);
            entity.Property(e => e.QuyenThem).HasDefaultValue(false);
            entity.Property(e => e.QuyenXem).HasDefaultValue(false);
            entity.Property(e => e.QuyenXoa).HasDefaultValue(false);

            entity.HasOne(d => d.IdChucNangNavigation).WithMany(p => p.PhanQuyenTaiKhoans).HasConstraintName("FK_PhanQuyenTaiKhoan_ChucNang");

            entity.HasOne(d => d.IdTaiKhoanNavigation).WithMany(p => p.PhanQuyenTaiKhoans)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PhanQuyen__IdTai__30F848ED");
        });

        modelBuilder.Entity<PhieuGiamGium>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PhieuGia__3214EC07979DF2D9");
        });

        modelBuilder.Entity<Sach>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Sach__3214EC0746DB4F68");

            entity.HasOne(d => d.IdTheLoaiNavigation).WithMany(p => p.Saches).HasConstraintName("FK__Sach__IdTheLoai__35BCFE0A");
        });

        modelBuilder.Entity<TaiKhoan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TaiKhoan__3214EC07B2537B6F");

            entity.Property(e => e.SoLanNhapSaiMatKhau).HasDefaultValue(0);

            entity.HasOne(d => d.IdChucVuNavigation).WithMany(p => p.TaiKhoans).HasConstraintName("FK__TaiKhoan__IdChuc__2A4B4B5E");

            entity.HasOne(d => d.LoaiTaiKhoan).WithMany(p => p.TaiKhoans).HasConstraintName("FK__TaiKhoan__LoaiTa__29572725");
        });

        modelBuilder.Entity<ThanhToanTam>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ThanhToa__3214EC07253C857F");
        });

        modelBuilder.Entity<TheLoai>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TheLoai__3214EC072FF4ADDC");
        });

        modelBuilder.Entity<TonKho>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TonKho__3214EC070C312EAB");

            entity.HasOne(d => d.IdSachNavigation).WithMany(p => p.TonKhos).HasConstraintName("FK__TonKho__IdSach__5CD6CB2B");
        });

        modelBuilder.Entity<TrangThaiDonHang>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TrangTha__3214EC07A82498C4");
        });

        modelBuilder.Entity<TrangThaiThanhToan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TrangTha__3214EC07646D6C96");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
