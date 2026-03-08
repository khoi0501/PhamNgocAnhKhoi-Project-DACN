using cuoiky.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ThongKeController : ControllerBase
    {
        private readonly QuanLySachContext _context;

        public ThongKeController(QuanLySachContext context)
        {
            _context = context;
        }

        // ==========================================
        // ✅ THỐNG KÊ ĐƠN HÀNG
        // ==========================================

        /// <summary>
        /// Thống kê doanh thu theo ngày/tháng/năm
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("DoanhThu")]
        public async Task<IActionResult> ThongKeDoanhThu(
           [FromQuery] string? loai = "thang", // ngay, thang, nam
           [FromQuery] DateTime? tuNgay = null,
           [FromQuery] DateTime? denNgay = null)
        {
            try
            {
                var query = _context.DonHangs.AsQueryable();
                // Lọc theo khoảng thời gian
                if (tuNgay.HasValue)
                {
                    var tuNgayDate = DateOnly.FromDateTime(tuNgay.Value);
                    query = query.Where(dh => dh.NgayDat >= tuNgayDate);
                }
                if (denNgay.HasValue)
                {
                    var denNgayDate = DateOnly.FromDateTime(denNgay.Value);
                    query = query.Where(dh => dh.NgayDat <= denNgayDate);
                }

                // ✅ Chỉ lấy đơn hàng CÓ trang thái là "Đơn hàng đã giao" (Status ID = 6)
                query = query.Where(dh => dh.IdTrangThaiDonHangNavigation != null &&
                                          dh.IdTrangThaiDonHangNavigation.TenTrangThai == "Đơn hàng đã giao");

                object? thongKe = null;
                switch ((loai ?? "thang").ToLower())
                {
                    case "ngay":
                        thongKe = await query
                            .GroupBy(dh => dh.NgayDat)
                            .Select(g => new
                            {
                                Ngay = g.Key,
                                SoDonHang = g.Count(),
                                // ✅ FIX: Cộng thêm PhiVanChuyen
                                TongDoanhThu = g.Sum(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen - dh.GiaTriGiam),
                                TongGiaTriGiam = g.Sum(dh => dh.GiaTriGiam),
                                // ✅ FIX: Cộng thêm PhiVanChuyen vào Tiền Gốc
                                TongTienGoc = g.Sum(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen)
                            })
                            .OrderBy(x => x.Ngay)
                            .ToListAsync();
                        break;
                    case "thang":
                        thongKe = await query
                            .Where(dh => dh.NgayDat.HasValue)
                            .GroupBy(dh => new { dh.NgayDat!.Value.Year, dh.NgayDat.Value.Month })
                            .Select(g => new
                            {
                                Nam = g.Key.Year,
                                Thang = g.Key.Month,
                                SoDonHang = g.Count(),
                                TongDoanhThu = g.Sum(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen - dh.GiaTriGiam),
                                TongGiaTriGiam = g.Sum(dh => dh.GiaTriGiam),
                                TongTienGoc = g.Sum(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen)
                            })
                            .OrderBy(x => x.Nam).ThenBy(x => x.Thang)
                            .ToListAsync();
                        break;
                    case "nam":
                        thongKe = await query
                            .Where(dh => dh.NgayDat.HasValue)
                            .GroupBy(dh => dh.NgayDat!.Value.Year)
                            .Select(g => new
                            {
                                Nam = g.Key,
                                SoDonHang = g.Count(),
                                TongDoanhThu = g.Sum(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen - dh.GiaTriGiam),
                                TongGiaTriGiam = g.Sum(dh => dh.GiaTriGiam),
                                TongTienGoc = g.Sum(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen)
                            })
                            .OrderBy(x => x.Nam)
                            .ToListAsync();
                        break;
                    default:
                        return Ok(new { statusCode = 400, message = "Loại thống kê không hợp lệ (ngay/thang/nam)" });
                }
                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê doanh thu thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê doanh thu: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thống kê số đơn hàng theo trạng thái
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("DonHangTheoTrangThai")]
        public async Task<IActionResult> ThongKeDonHangTheoTrangThai()
        {
            try
            {
                var thongKe = await _context.DonHangs
                    .Include(dh => dh.IdTrangThaiDonHangNavigation)
                    .GroupBy(dh => new
                    {
                        IdTrangThai = dh.IdTrangThaiDonHang ?? 0,
                        TenTrangThai = dh.IdTrangThaiDonHangNavigation != null
                            ? dh.IdTrangThaiDonHangNavigation.TenTrangThai
                            : "Chưa xác định"
                    })
                    .Select(g => new
                    {
                        IdTrangThai = g.Key.IdTrangThai,
                        TenTrangThai = g.Key.TenTrangThai,
                        SoLuong = g.Count(),
                        // ✅ FIX: Cộng thêm PhiVanChuyen
                        TongTien = g.Sum(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen),
                        DoanhThu = g.Sum(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen - dh.GiaTriGiam)
                    })
                    .OrderByDescending(x => x.SoLuong)
                    .ToListAsync();

                var tongDon = thongKe.Sum(x => x.SoLuong);
                var tyLe = thongKe.Select(x => new
                {
                    x.IdTrangThai,
                    x.TenTrangThai,
                    x.SoLuong,
                    x.TongTien,
                    x.DoanhThu,
                    TyLe = tongDon > 0 ? Math.Round((double)x.SoLuong / tongDon * 100, 2) : 0
                }).ToList();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê đơn hàng theo trạng thái thành công",
                    data = new
                    {
                        chiTiet = tyLe,
                        tongDonHang = tongDon
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê đơn hàng: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thống kê sản phẩm bán chạy
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("SanPhamBanChay")]
        public async Task<IActionResult> ThongKeSanPhamBanChay(
      [FromQuery] int top = 10,
      [FromQuery] DateTime? tuNgay = null,
      [FromQuery] DateTime? denNgay = null)
        {
            try
            {
                var query = _context.ChiTietDonHangs
                    .Include(ct => ct.IdSachNavigation)
                    .Include(ct => ct.IdDonHangNavigation)
                    // Lọc chỉ lấy các đơn hàng đã giao thành công (Id = 6)
                    .Where(ct => ct.IdDonHangNavigation != null &&
                                 ct.IdDonHangNavigation.IdTrangThaiDonHang == 6)
                    .AsQueryable();

                // Lọc theo thời gian
                if (tuNgay.HasValue)
                {
                    var tuNgayDate = DateOnly.FromDateTime(tuNgay.Value);
                    query = query.Where(ct => ct.IdDonHangNavigation!.NgayDat >= tuNgayDate);
                }
                if (denNgay.HasValue)
                {
                    var denNgayDate = DateOnly.FromDateTime(denNgay.Value);
                    query = query.Where(ct => ct.IdDonHangNavigation!.NgayDat <= denNgayDate);
                }

                var thongKe = await query
                    .Where(ct => ct.IdSachNavigation != null)
                    .GroupBy(ct => new
                    {
                        IdSach = ct.IdSach ?? 0,
                        TenSach = ct.IdSachNavigation!.TenSach,
                        TheLoai = ct.IdSachNavigation.IdTheLoaiNavigation != null
                            ? ct.IdSachNavigation.IdTheLoaiNavigation.TenTheLoai
                            : null
                    })
                    .Select(g => new
                    {
                        g.Key.IdSach,
                        g.Key.TenSach,
                        g.Key.TheLoai,
                        SoLuongBan = g.Sum(ct => ct.SoLuong ?? 0),
                        DoanhThu = g.Sum(ct => (ct.Gia ?? 0) * (ct.SoLuong ?? 0)),
                        SoDonHang = g.Select(ct => ct.IdDonHang).Distinct().Count()
                    })
                    .OrderByDescending(x => x.SoLuongBan)
                    .Take(top)
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê sản phẩm bán chạy thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê sản phẩm bán chạy: {ex.Message}" });
            }
        }

        // ==========================================
        // ✅ THỐNG KÊ NHẬP HÀNG
        // ==========================================

        /// <summary>
        /// Thống kê chi phí nhập hàng theo thời gian
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("ChiPhiNhapHang")]
        public async Task<IActionResult> ThongKeChiPhiNhapHang(
            [FromQuery] string? loai = "thang", // ngay, thang, nam
            [FromQuery] DateTime? tuNgay = null,
            [FromQuery] DateTime? denNgay = null)
        {
            try
            {
                var query = _context.NhapHangs.AsQueryable();

                // Lọc theo khoảng thời gian
                if (tuNgay.HasValue)
                {
                    query = query.Where(nh => nh.NgayNhap >= tuNgay.Value);
                }
                if (denNgay.HasValue)
                {
                    query = query.Where(nh => nh.NgayNhap <= denNgay.Value);
                }

                object? thongKe = null;

                switch ((loai ?? "thang").ToLower())
                {
                    case "ngay":
                        thongKe = await query
                            .Where(nh => nh.NgayNhap.HasValue)
                            .GroupBy(nh => nh.NgayNhap!.Value.Date)
                            .Select(g => new
                            {
                                Ngay = g.Key,
                                SoPhieuNhap = g.Count(),
                                TongSoLuong = g.Sum(nh => nh.SoLuongNhap ?? 0),
                                TongChiPhi = g.Sum(nh => (nh.GiaNhap ?? 0) * (nh.SoLuongNhap ?? 0))
                            })
                            .OrderBy(x => x.Ngay)
                            .ToListAsync();
                        break;

                    case "thang":
                        thongKe = await query
                            .Where(nh => nh.NgayNhap.HasValue)
                            .GroupBy(nh => new { nh.NgayNhap!.Value.Year, nh.NgayNhap.Value.Month })
                            .Select(g => new
                            {
                                Nam = g.Key.Year,
                                Thang = g.Key.Month,
                                SoPhieuNhap = g.Count(),
                                TongSoLuong = g.Sum(nh => nh.SoLuongNhap ?? 0),
                                TongChiPhi = g.Sum(nh => (nh.GiaNhap ?? 0) * (nh.SoLuongNhap ?? 0))
                            })
                            .OrderBy(x => x.Nam).ThenBy(x => x.Thang)
                            .ToListAsync();
                        break;

                    case "nam":
                        thongKe = await query
                            .Where(nh => nh.NgayNhap.HasValue)
                            .GroupBy(nh => nh.NgayNhap!.Value.Year)
                            .Select(g => new
                            {
                                Nam = g.Key,
                                SoPhieuNhap = g.Count(),
                                TongSoLuong = g.Sum(nh => nh.SoLuongNhap ?? 0),
                                TongChiPhi = g.Sum(nh => (nh.GiaNhap ?? 0) * (nh.SoLuongNhap ?? 0))
                            })
                            .OrderBy(x => x.Nam)
                            .ToListAsync();
                        break;

                    default:
                        return Ok(new { statusCode = 400, message = "Loại thống kê không hợp lệ (ngay/thang/nam)" });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê chi phí nhập hàng thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê chi phí nhập hàng: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thống kê số lượng nhập theo sản phẩm
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("NhapHangTheoSanPham")]
        public async Task<IActionResult> ThongKeNhapHangTheoSanPham([FromQuery] int top = 10)
        {
            try
            {
                var thongKe = await _context.NhapHangs
                    .Include(nh => nh.IdTheLoaiNavigation)
                    .GroupBy(nh => new
                    {
                        TenSach = nh.TenSach ?? "Chưa xác định",
                        IdTheLoai = nh.IdTheLoai,
                        TenTheLoai = nh.IdTheLoaiNavigation != null
                            ? nh.IdTheLoaiNavigation.TenTheLoai
                            : null
                    })
                    .Select(g => new
                    {
                        g.Key.TenSach,
                        g.Key.IdTheLoai,
                        g.Key.TenTheLoai,
                        TongSoLuongNhap = g.Sum(nh => nh.SoLuongNhap ?? 0),
                        TongChiPhi = g.Sum(nh => (nh.GiaNhap ?? 0) * (nh.SoLuongNhap ?? 0)),
                        SoPhieuNhap = g.Count(),
                        GiaNhapTrungBinh = g.Average(nh => nh.GiaNhap ?? 0)
                    })
                    .OrderByDescending(x => x.TongSoLuongNhap)
                    .Take(top)
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê nhập hàng theo sản phẩm thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê nhập hàng: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thống kê chi phí nhập theo nhân viên
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("ChiPhiNhapTheoNhanVien")]
        public async Task<IActionResult> ThongKeChiPhiNhapTheoNhanVien()
        {
            try
            {
                var thongKe = await _context.NhapHangs
                    .Include(nh => nh.IdTaiKhoanNavigation)
                    .Where(nh => nh.IdTaiKhoanNavigation != null && nh.IdTaiKhoanNavigation.IsAdmin == true)
                    .GroupBy(nh => new
                    {
                        IdTaiKhoan = nh.IdTaiKhoan ?? 0,
                        TenNhanVien = nh.IdTaiKhoanNavigation!.HovaTen ?? nh.IdTaiKhoanNavigation.Email,
                        Email = nh.IdTaiKhoanNavigation.Email
                    })
                    .Select(g => new
                    {
                        g.Key.IdTaiKhoan,
                        g.Key.TenNhanVien,
                        g.Key.Email,
                        SoPhieuNhap = g.Count(),
                        TongSoLuongNhap = g.Sum(nh => nh.SoLuongNhap ?? 0),
                        TongChiPhi = g.Sum(nh => (nh.GiaNhap ?? 0) * (nh.SoLuongNhap ?? 0))
                    })
                    .OrderByDescending(x => x.TongChiPhi)
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê chi phí nhập theo nhân viên thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê chi phí nhập: {ex.Message}" });
            }
        }
        /// <summary>
        /// Lấy chi tiết nhập hàng theo nhân viên
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("ChiTietNhapHangTheoNhanVien")]
        public async Task<IActionResult> ThongKeChiTietNhapHangTheoNhanVien([FromQuery] int idTaiKhoan)
        {
            try
            {
                var chiTiet = await _context.NhapHangs
                    .Where(nh => nh.IdTaiKhoan == idTaiKhoan)
                    .OrderByDescending(nh => nh.NgayNhap)
                    .Select(nh => new
                    {
                        TenSach = nh.TenSach ?? "N/A",
                        SoLuongNhap = nh.SoLuongNhap ?? 0,
                        GiaNhap = nh.GiaNhap ?? 0,
                        ThanhTien = (nh.GiaNhap ?? 0) * (nh.SoLuongNhap ?? 0),
                        NgayNhap = nh.NgayNhap
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Lấy chi tiết nhập hàng theo nhân viên thành công",
                    data = chiTiet
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    statusCode = 500,
                    message = $"Lỗi khi lấy chi tiết nhập hàng: {ex.Message}"
                });
            }
        }

        // ==========================================
        // ✅ THỐNG KÊ TỒN KHO
        // ==========================================

        /// <summary>
        /// Thống kê tồn kho hiện tại
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("TonKhoHienTai")]
        public async Task<IActionResult> ThongKeTonKhoHienTai()
        {
            try
            {
                var thongKe = await _context.TonKhos
                    .Include(tk => tk.IdSachNavigation)
                    .ThenInclude(s => s!.IdTheLoaiNavigation)
                    .Where(tk => tk.IdSachNavigation != null)
                    .Select(tk => new
                    {
                        IdSach = tk.IdSach ?? 0,
                        TenSach = tk.IdSachNavigation!.TenSach,
                        TheLoai = tk.IdSachNavigation.IdTheLoaiNavigation != null
                            ? tk.IdSachNavigation.IdTheLoaiNavigation.TenTheLoai
                            : null,
                        TenTacGia = tk.IdSachNavigation.TenTacGia,
                        TenNhaSanXuat = tk.IdSachNavigation.TenNhaSanXuat,
                        SoLuongTon = tk.SoLuong ?? 0,
                        GiaBan = tk.IdSachNavigation.Gia ?? 0,
                        GiaTriTonKho = (tk.SoLuong ?? 0) * (tk.IdSachNavigation.Gia ?? 0)
                    })
                    .OrderByDescending(x => x.GiaTriTonKho)
                    .ToListAsync();

                var tongSoLuong = thongKe.Sum(x => x.SoLuongTon);
                var tongGiaTri = thongKe.Sum(x => x.GiaTriTonKho);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê tồn kho hiện tại thành công",
                    data = new
                    {
                        chiTiet = thongKe,
                        tongSoLuong = tongSoLuong,
                        tongGiaTri = tongGiaTri
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê tồn kho: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thống kê sản phẩm sắp hết (dưới ngưỡng)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("SanPhamSapHet")]
        public async Task<IActionResult> ThongKeSanPhamSapHet([FromQuery] int nguong = 10)
        {
            try
            {
                var thongKe = await _context.TonKhos
                    .Include(tk => tk.IdSachNavigation)
                    .ThenInclude(s => s!.IdTheLoaiNavigation)
                    .Where(tk => tk.IdSachNavigation != null && (tk.SoLuong ?? 0) <= nguong)
                    .Select(tk => new
                    {
                        IdSach = tk.IdSach ?? 0,
                        TenSach = tk.IdSachNavigation!.TenSach,
                        TheLoai = tk.IdSachNavigation.IdTheLoaiNavigation != null
                            ? tk.IdSachNavigation.IdTheLoaiNavigation.TenTheLoai
                            : null,
                        SoLuongTon = tk.SoLuong ?? 0,
                        GiaBan = tk.IdSachNavigation.Gia ?? 0
                    })
                    .OrderBy(x => x.SoLuongTon)
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê sản phẩm sắp hết thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê sản phẩm sắp hết: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thống kê tồn kho theo thể loại
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("TonKhoTheoTheLoai")]
        public async Task<IActionResult> ThongKeTonKhoTheoTheLoai()
        {
            try
            {
                var thongKe = await _context.TonKhos
                    .Include(tk => tk.IdSachNavigation)
                    .ThenInclude(s => s!.IdTheLoaiNavigation)
                    .Where(tk => tk.IdSachNavigation != null && tk.IdSachNavigation.IdTheLoaiNavigation != null)
                    .GroupBy(tk => new
                    {
                        IdTheLoai = tk.IdSachNavigation!.IdTheLoai ?? 0,
                        TenTheLoai = tk.IdSachNavigation.IdTheLoaiNavigation!.TenTheLoai
                    })
                    .Select(g => new
                    {
                        g.Key.IdTheLoai,
                        g.Key.TenTheLoai,
                        SoSanPham = g.Count(),
                        TongSoLuong = g.Sum(tk => tk.SoLuong ?? 0),
                        TongGiaTri = g.Sum(tk => (tk.SoLuong ?? 0) * (tk.IdSachNavigation!.Gia ?? 0))
                    })
                    .OrderByDescending(x => x.TongGiaTri)
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê tồn kho theo thể loại thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê tồn kho: {ex.Message}" });
            }
        }

        // ==========================================
        // ✅ THỐNG KÊ PHIẾU GIẢM GIÁ
        // ==========================================

        /// <summary>
        /// Thống kê phiếu giảm giá
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("PhieuGiamGia")]
        public async Task<IActionResult> ThongKePhieuGiamGia()
        {
            try
            {
                var ngayHienTai = DateOnly.FromDateTime(DateTime.Now);

                var thongKe = await _context.PhieuGiamGia
                    .Select(pg => new
                    {
                        Id = pg.Id,
                        MaGiamGia = pg.MaGiamGia,
                        GiaTriGiam = pg.GiaTriGiam,
                        NgayKetThuc = pg.NgayKetThuc,
                        LoaiPhieuGiamGia = pg.LoaiPhieuGiamGia,
                        SoLanSuDung = _context.ChiTietPhieuGiamGia
                            .Count(ct => ct.IdGiamGia == pg.Id),
                        GiaTriDaApDung = _context.ChiTietPhieuGiamGia
                            .Where(ct => ct.IdGiamGia == pg.Id)
                            .Count() * pg.GiaTriGiam, // Ước tính
                        IsValid = pg.NgayKetThuc >= ngayHienTai,
                        SapHetHan = pg.NgayKetThuc >= ngayHienTai &&
                                   pg.NgayKetThuc <= ngayHienTai.AddDays(7)
                    })
                    .ToListAsync();

                var tongSoPhieu = thongKe.Count;
                var tongGiaTriGiam = thongKe.Sum(x => x.GiaTriGiam);
                var tongGiaTriDaApDung = thongKe.Sum(x => x.GiaTriDaApDung);
                var soPhieuSapHetHan = thongKe.Count(x => x.SapHetHan);
                var soPhieuDaSuDung = thongKe.Count(x => x.SoLanSuDung > 0);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê phiếu giảm giá thành công",
                    data = new
                    {
                        chiTiet = thongKe,
                        tongSoat = new
                        {
                            tongSoPhieu = tongSoPhieu,
                            tongGiaTriGiam = tongGiaTriGiam,
                            tongGiaTriDaApDung = tongGiaTriDaApDung,
                            soPhieuSapHetHan = soPhieuSapHetHan,
                            soPhieuDaSuDung = soPhieuDaSuDung
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê phiếu giảm giá: {ex.Message}" });
            }
        }

        // ==========================================
        // ✅ THỐNG KÊ ĐÁNH GIÁ
        // ==========================================

        /// <summary>
        /// Thống kê đánh giá trung bình theo sản phẩm
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("DanhGiaTheoSanPham")]
        public async Task<IActionResult> ThongKeDanhGiaTheoSanPham([FromQuery] int top = 10)
        {
            try
            {
                var thongKe = await _context.DanhGia
                    .Include(dg => dg.IdSachNavigation)
                    .Include(dg => dg.IdTaiKhoanNavigation)   // lấy tên tài khoản
                    .Where(dg => dg.IdSachNavigation != null)
                    .GroupBy(dg => new
                    {
                        IdSach = dg.IdSach ?? 0,
                        TenSach = dg.IdSachNavigation!.TenSach
                    })
                    .Select(g => new
                    {
                        g.Key.IdSach,
                        g.Key.TenSach,
                        SoLuongDanhGia = g.Count(),
                        DiemTrungBinh = Math.Round(g.Average(dg => dg.SoSao ?? 0), 2),
                        DiemCaoNhat = g.Max(dg => dg.SoSao ?? 0),
                        DiemThapNhat = g.Min(dg => dg.SoSao ?? 0),

                        // 🟡 ĐÁNH GIÁ MỚI NHẤT THEO SẢN PHẨM
                        DanhGiaMoiNhat = g
                            .OrderByDescending(dg => dg.NgayDanhGia)
                            .Select(dg => new
                            {
                                NgayDanhGia = dg.NgayDanhGia,
                                TenTaiKhoan = dg.IdTaiKhoanNavigation != null
                                    ? (dg.IdTaiKhoanNavigation.HovaTen ?? dg.IdTaiKhoanNavigation.Email)
                                    : "Ẩn danh",
                                NoiDung = dg.NoiDung
                            })
                            .FirstOrDefault()
                    })
                    .OrderByDescending(x => x.DiemTrungBinh)
                    .ThenByDescending(x => x.SoLuongDanhGia)
                    .Take(top)
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê đánh giá theo sản phẩm thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê đánh giá: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thống kê số lượng đánh giá theo thời gian
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("DanhGiaTheoThoiGian")]
        public async Task<IActionResult> ThongKeDanhGiaTheoThoiGian(
     [FromQuery] string? loai = "thang", // ngay, thang, nam
     [FromQuery] DateTime? tuNgay = null,
     [FromQuery] DateTime? denNgay = null)
        {
            try
            {
                var query = _context.DanhGia
                    .Include(dg => dg.IdTaiKhoanNavigation)
                    .AsQueryable();

                // Lọc theo khoảng thời gian
                if (tuNgay.HasValue)
                {
                    query = query.Where(dg => dg.NgayDanhGia >= tuNgay.Value);
                }
                if (denNgay.HasValue)
                {
                    query = query.Where(dg => dg.NgayDanhGia <= denNgay.Value);
                }

                object? thongKe = null;
                var loaiThongKe = (loai ?? "thang").ToLower();

                switch (loaiThongKe)
                {
                    case "ngay":
                        thongKe = await query
                            .Where(dg => dg.NgayDanhGia.HasValue)
                            .GroupBy(dg => dg.NgayDanhGia!.Value.Date)
                            .Select(g => new
                            {
                                Ngay = g.Key,
                                SoLuongDanhGia = g.Count(),
                                DiemTrungBinh = Math.Round(g.Average(dg => dg.SoSao ?? 0), 2),
                                DanhGiaMoiNhat = g
                                    .OrderByDescending(dg => dg.NgayDanhGia)
                                    .Select(dg => new
                                    {
                                        NgayDanhGia = dg.NgayDanhGia,
                                        TenTaiKhoan = dg.IdTaiKhoanNavigation != null
                                            ? (dg.IdTaiKhoanNavigation.HovaTen ?? dg.IdTaiKhoanNavigation.Email)
                                            : "Ẩn danh",
                                        NoiDung = dg.NoiDung
                                    })
                                    .FirstOrDefault()
                            })
                            .OrderBy(x => x.Ngay)
                            .ToListAsync();
                        break;

                    case "thang":
                        thongKe = await query
                            .Where(dg => dg.NgayDanhGia.HasValue)
                            .GroupBy(dg => new { dg.NgayDanhGia!.Value.Year, dg.NgayDanhGia.Value.Month })
                            .Select(g => new
                            {
                                Nam = g.Key.Year,
                                Thang = g.Key.Month,
                                SoLuongDanhGia = g.Count(),
                                DiemTrungBinh = Math.Round(g.Average(dg => dg.SoSao ?? 0), 2),
                                DanhGiaMoiNhat = g
                                    .OrderByDescending(dg => dg.NgayDanhGia)
                                    .Select(dg => new
                                    {
                                        NgayDanhGia = dg.NgayDanhGia,
                                        TenTaiKhoan = dg.IdTaiKhoanNavigation != null
                                            ? (dg.IdTaiKhoanNavigation.HovaTen ?? dg.IdTaiKhoanNavigation.Email)
                                            : "Ẩn danh",
                                        NoiDung = dg.NoiDung
                                    })
                                    .FirstOrDefault()
                            })
                            .OrderBy(x => x.Nam).ThenBy(x => x.Thang)
                            .ToListAsync();
                        break;

                    case "nam":
                        thongKe = await query
                            .Where(dg => dg.NgayDanhGia.HasValue)
                            .GroupBy(dg => dg.NgayDanhGia!.Value.Year)
                            .Select(g => new
                            {
                                Nam = g.Key,
                                SoLuongDanhGia = g.Count(),
                                DiemTrungBinh = Math.Round(g.Average(dg => dg.SoSao ?? 0), 2),
                                DanhGiaMoiNhat = g
                                    .OrderByDescending(dg => dg.NgayDanhGia)
                                    .Select(dg => new
                                    {
                                        NgayDanhGia = dg.NgayDanhGia,
                                        TenTaiKhoan = dg.IdTaiKhoanNavigation != null
                                            ? (dg.IdTaiKhoanNavigation.HovaTen ?? dg.IdTaiKhoanNavigation.Email)
                                            : "Ẩn danh",
                                        NoiDung = dg.NoiDung
                                    })
                                    .FirstOrDefault()
                            })
                            .OrderBy(x => x.Nam)
                            .ToListAsync();
                        break;

                    default:
                        return Ok(new { statusCode = 400, message = "Loại thống kê không hợp lệ (ngay/thang/nam)" });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê đánh giá theo thời gian thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê đánh giá: {ex.Message}" });
            }
        }

        // ==========================================
        // ✅ THỐNG KÊ SÁCH
        // ==========================================

        /// <summary>
        /// Thống kê sản phẩm được xem nhiều nhất
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("SachDuocXemNhieuNhat")]
        public async Task<IActionResult> ThongKeSachDuocXemNhieuNhat([FromQuery] int top = 10)
        {
            try
            {
                var thongKe = await _context.Saches
                    .Include(s => s.IdTheLoaiNavigation)
                    .OrderByDescending(s => s.LuotXem)
                    .Take(top)
                    .Select(s => new
                    {
                        Id = s.Id,
                        TenSach = s.TenSach,
                        TheLoai = s.IdTheLoaiNavigation != null
                            ? s.IdTheLoaiNavigation.TenTheLoai
                            : null,
                        LuotXem = s.LuotXem ?? 0,
                        Gia = s.Gia ?? 0,
                        SoLuong = s.SoLuong ?? 0
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê sách được xem nhiều nhất thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê sách: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thống kê doanh thu theo sản phẩm
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("DoanhThuTheoSanPham")]
        public async Task<IActionResult> ThongKeDoanhThuTheoSanPham([FromQuery] int top = 10)
        {
            try
            {
                var thongKe = await _context.ChiTietDonHangs
                    .Include(ct => ct.IdSachNavigation)
                    .ThenInclude(s => s!.IdTheLoaiNavigation)
                    .Where(ct => ct.IdSachNavigation != null)
                    .GroupBy(ct => new
                    {
                        IdSach = ct.IdSach ?? 0,
                        TenSach = ct.IdSachNavigation!.TenSach,
                        TheLoai = ct.IdSachNavigation.IdTheLoaiNavigation != null
                            ? ct.IdSachNavigation.IdTheLoaiNavigation.TenTheLoai
                            : null
                    })
                    .Select(g => new
                    {
                        g.Key.IdSach,
                        g.Key.TenSach,
                        g.Key.TheLoai,
                        SoLuongBan = g.Sum(ct => ct.SoLuong ?? 0),
                        DoanhThu = g.Sum(ct => (ct.Gia ?? 0) * (ct.SoLuong ?? 0))
                    })
                    .OrderByDescending(x => x.DoanhThu)
                    .Take(top)
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê doanh thu theo sản phẩm thành công",
                    data = thongKe
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê doanh thu: {ex.Message}" });
            }
        }

        // ==========================================
        // ✅ TỔNG HỢP THỐNG KÊ
        // ==========================================

        /// <summary>
        /// Tổng hợp thống kê tổng quan
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("TongHop")]
        public async Task<IActionResult> ThongKeTongHop()
        {
            try
            {
                var ngayHienTai = DateOnly.FromDateTime(DateTime.Now);
                var thangHienTai = DateTime.Now;
                var namHienTai = DateTime.Now.Year;

                // ✅ FIX: Thêm kiểm tra != null và CỘNG NGAY PHI VAN CHUYEN
                // Doanh thu hôm nay
                var doanhThuHomNay = await _context.DonHangs
                    .Where(dh => dh.NgayDat == ngayHienTai &&
                                 dh.IdTrangThaiDonHangNavigation != null &&
                                 dh.IdTrangThaiDonHangNavigation.TenTrangThai == "Đơn hàng đã giao")
                    .SumAsync(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen - dh.GiaTriGiam);

                // Doanh thu tháng này
                var doanhThuThangNay = await _context.DonHangs
                    .Where(dh => dh.NgayDat.HasValue &&
                               dh.NgayDat.Value.Year == thangHienTai.Year &&
                               dh.NgayDat.Value.Month == thangHienTai.Month &&
                               dh.IdTrangThaiDonHangNavigation != null &&
                               dh.IdTrangThaiDonHangNavigation.TenTrangThai == "Đơn hàng đã giao")
                    .SumAsync(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen - dh.GiaTriGiam);

                // Doanh thu năm này
                var doanhThuNamNay = await _context.DonHangs
                    .Where(dh => dh.NgayDat.HasValue && dh.NgayDat.Value.Year == namHienTai &&
                                 dh.IdTrangThaiDonHangNavigation != null &&
                                 dh.IdTrangThaiDonHangNavigation.TenTrangThai == "Đơn hàng đã giao")
                    .SumAsync(dh => (dh.TongTien ?? 0) + dh.PhiVanChuyen - dh.GiaTriGiam);

                // Các thống kê khác giữ nguyên
                var tongDonHang = await _context.DonHangs.CountAsync();
                var donHangHomNay = await _context.DonHangs
                    .CountAsync(dh => dh.NgayDat == ngayHienTai);
                var tongSanPham = await _context.Saches.CountAsync();
                var tongTonKho = await _context.TonKhos.SumAsync(tk => tk.SoLuong ?? 0);
                var tongDanhGia = await _context.DanhGia.CountAsync();
                var diemTrungBinh = await _context.DanhGia
                    .Where(dg => dg.SoSao.HasValue)
                    .AverageAsync(dg => dg.SoSao ?? 0);
                var tongPhieuGiamGia = await _context.PhieuGiamGia.CountAsync();
                var phieuSapHetHan = await _context.PhieuGiamGia
                    .CountAsync(pg => pg.NgayKetThuc >= ngayHienTai &&
                                     pg.NgayKetThuc <= ngayHienTai.AddDays(7));
                var chiPhiNhapThangNay = await _context.NhapHangs
                    .Where(nh => nh.NgayNhap.HasValue &&
                               nh.NgayNhap.Value.Year == thangHienTai.Year &&
                               nh.NgayNhap.Value.Month == thangHienTai.Month)
                    .SumAsync(nh => (nh.GiaNhap ?? 0) * (nh.SoLuongNhap ?? 0));

                var tongHop = new
                {
                    doanhThu = new
                    {
                        homNay = doanhThuHomNay,
                        thangNay = doanhThuThangNay,
                        namNay = doanhThuNamNay
                    },
                    donHang = new
                    {
                        tong = tongDonHang,
                        homNay = donHangHomNay
                    },
                    sanPham = new
                    {
                        tong = tongSanPham,
                        tongTonKho = tongTonKho
                    },
                    danhGia = new
                    {
                        tong = tongDanhGia,
                        diemTrungBinh = Math.Round((double)diemTrungBinh, 2)
                    },
                    phieuGiamGia = new
                    {
                        tong = tongPhieuGiamGia,
                        sapHetHan = phieuSapHetHan
                    },
                    chiPhiNhapHang = new
                    {
                        thangNay = chiPhiNhapThangNay
                    },
                    loiNhuan = new
                    {
                        thangNay = doanhThuThangNay - chiPhiNhapThangNay
                    }
                };
                return Ok(new
                {
                    statusCode = 200,
                    message = "Thống kê tổng hợp thành công",
                    data = tongHop
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thống kê tổng hợp: {ex.Message}" });
            }
        }
    }
}