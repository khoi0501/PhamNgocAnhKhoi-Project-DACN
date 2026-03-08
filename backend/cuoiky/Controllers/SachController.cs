using cuoiky.DTOs;
using cuoiky.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SachController : ControllerBase
    {
        private readonly QuanLySachContext _context;

        public SachController(QuanLySachContext context)
        {
            _context = context;
        }

        // ✅ 1. Lấy tất cả sách
        [Authorize]
        [HttpGet("LayDanhSach")]
        public async Task<IActionResult> GetAll()
        {
            var dsSach = await _context.Saches
                .Select(s => new SachDTO
                {
                    Id = s.Id,
                    TenSach = s.TenSach,
                    SoLuong = s.SoLuong,
                    Gia = s.Gia,
                    HinhAnh = s.HinhAnh,
                    MoTa = s.MoTa,
                    IdTheLoai = s.IdTheLoai,
                    TenTacGia = s.TenTacGia,
                    TenNhaSanXuat = s.TenNhaSanXuat,
                    NgaySanXuat = s.NgaySanXuat,
                    LuotXem = s.LuotXem
                })
                .ToListAsync();

            return Ok(new { statusCode = 200, data = dsSach });
        }

        // ✅ 2. Lấy 1 sách theo ID

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var sach = await _context.Saches.FindAsync(id);
            if (sach == null)
                return NotFound(new { statusCode = 404, message = "Không tìm thấy sách" });

            var dto = new SachDTO
            {
                Id = sach.Id,
                TenSach = sach.TenSach,
                SoLuong = sach.SoLuong,
                Gia = sach.Gia,
                HinhAnh = sach.HinhAnh,
                MoTa = sach.MoTa,
                IdTheLoai = sach.IdTheLoai,
                TenTacGia = sach.TenTacGia,
                TenNhaSanXuat = sach.TenNhaSanXuat,
                NgaySanXuat = sach.NgaySanXuat,
                LuotXem = sach.LuotXem
            };

            return Ok(new { statusCode = 200, data = dto });
        }

        // ✅ 3. Thêm sách mới
        [Authorize]
        [HttpPost("CreateSach")]
        public async Task<IActionResult> Create([FromBody] SachDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.TenSach))
                return BadRequest(new { statusCode = 400, message = "Tên sách không được để trống" });

            var sach = new Sach
            {
                TenSach = dto.TenSach,
                SoLuong = dto.SoLuong,
                Gia = dto.Gia,
                HinhAnh = dto.HinhAnh,
                MoTa = dto.MoTa,
                IdTheLoai = dto.IdTheLoai,
                TenTacGia = dto.TenTacGia,
                TenNhaSanXuat = dto.TenNhaSanXuat,
                NgaySanXuat = dto.NgaySanXuat,
                LuotXem = 0
            };

            _context.Saches.Add(sach);
            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Thêm sách thành công" });
        }

        // ✅ 4. Cập nhật thông tin sách
        [Authorize]
        [HttpPut("CapNhat/{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] SachDTO dto)
        {
            var sach = await _context.Saches.FindAsync(id);
            if (sach == null)
                return NotFound(new { statusCode = 404, message = "Không tìm thấy sách" });

            sach.TenSach = dto.TenSach ?? sach.TenSach;
            sach.SoLuong = dto.SoLuong ?? sach.SoLuong;
            sach.Gia = dto.Gia ?? sach.Gia;
            sach.HinhAnh = dto.HinhAnh ?? sach.HinhAnh;
            sach.MoTa = dto.MoTa ?? sach.MoTa;
            sach.IdTheLoai = dto.IdTheLoai ?? sach.IdTheLoai;
            sach.TenTacGia = dto.TenTacGia ?? sach.TenTacGia;
            sach.TenNhaSanXuat = dto.TenNhaSanXuat ?? sach.TenNhaSanXuat;
            sach.NgaySanXuat = dto.NgaySanXuat ?? sach.NgaySanXuat;

            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Cập nhật sách thành công" });
        }


        // ✅ 5. Tăng lượt xem sách
        [HttpPost("TangLuotXem/{id}")]
        public async Task<IActionResult> TangLuotXem(long id)
        {
            var sach = await _context.Saches.FindAsync(id);
            if (sach == null)
                return NotFound(new { statusCode = 404, message = "Không tìm thấy sách" });

            // Tăng lượt xem lên 1
            sach.LuotXem = (sach.LuotXem ?? 0) + 1;

            await _context.SaveChangesAsync();

            return Ok(new {
                statusCode = 200,
                message = "Tăng lượt xem thành công",
                data = new {
                    id = sach.Id,
                    tenSach = sach.TenSach,
                    luotXem = sach.LuotXem
                }
            });
        }

        // ✅ 6. Đánh giá sách (chỉ cho người đã mua)
        [Authorize]
        [HttpPost("DanhGia")]
        public async Task<IActionResult> DanhGiaSach([FromBody] CreateReviewDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return Ok(new { statusCode = 400, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            // Lấy thông tin user từ token
            var email = User?.FindFirstValue(ClaimTypes.Email) ?? User?.FindFirst("sub")?.Value;
            if (string.IsNullOrWhiteSpace(email))
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }

            var user = await _context.TaiKhoans.FirstOrDefaultAsync(t => t.Email == email);
            if (user == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy tài khoản" });
            }

            // Kiểm tra sách có tồn tại không
            var sach = await _context.Saches.FindAsync(dto.IdSach);
            if (sach == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy sách" });
            }

            // Kiểm tra user đã mua sách này chưa
            var daMuaSach = await _context.ChiTietDonHangs
                .AnyAsync(ct => ct.IdSach == dto.IdSach &&
                               ct.IdDonHangNavigation != null &&
                               ct.IdDonHangNavigation.IdTaiKhoan == user.Id);

            if (!daMuaSach)
            {
                return Ok(new { statusCode = 400, message = "Bạn chưa mua sách này, không thể đánh giá" });
            }

            // Kiểm tra đã đánh giá chưa
            var daDanhGia = await _context.DanhGia
                .AnyAsync(dg => dg.IdTaiKhoan == user.Id && dg.IdSach == dto.IdSach);

            if (daDanhGia)
            {
                return Ok(new { statusCode = 400, message = "Bạn đã đánh giá sách này rồi" });
            }

            // Tạo đánh giá mới
            var danhGia = new DanhGium
            {
                IdTaiKhoan = user.Id,
                IdSach = dto.IdSach,
                SoSao = dto.SoSao,
                NoiDung = dto.NoiDung,
                NgayDanhGia = DateTime.Now
            };

            _context.DanhGia.Add(danhGia);
            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Đánh giá thành công" });
        }

        // ✅ 7. Lấy danh sách đánh giá của sách
        [HttpGet("{id}/DanhGia")]
        public async Task<IActionResult> LayDanhGiaSach(long id)
        {
            var sach = await _context.Saches.FindAsync(id);
            if (sach == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy sách" });
            }

            var danhGia = await _context.DanhGia
                .Where(dg => dg.IdSach == id)
                .Include(dg => dg.IdTaiKhoanNavigation)
                .Select(dg => new ReviewResponseDTO
                {
                    Id = dg.Id,
                    IdTaiKhoan = dg.IdTaiKhoan,
                    Email = dg.IdTaiKhoanNavigation.Email,
                    SoSao = dg.SoSao,
                    NoiDung = dg.NoiDung,
                    NgayDanhGia = dg.NgayDanhGia
                })
                .OrderByDescending(dg => dg.NgayDanhGia)
                .ToListAsync();

            var diemTrungBinh = danhGia.Any() ? danhGia.Average(dg => dg.SoSao ?? 0) : 0;

            var result = new BookReviewSummaryDTO
            {
                IdSach = id,
                TenSach = sach.TenSach,
                DiemTrungBinh = Math.Round(diemTrungBinh, 1),
                TongSoDanhGia = danhGia.Count,
                DanhSachDanhGia = danhGia
            };

            return Ok(new { statusCode = 200, data = result });
        }

        // ==========================================
        // ✅ QUẢN LÝ NHẬP HÀNG
        // ==========================================

        // ✅ 1. Lấy danh sách nhập hàng
        // ✅ 1. Lấy danh sách nhập hàng
        [Authorize(Roles = "Admin")]
        [HttpGet("NhapHang/LayDanhSach")]
        public async Task<IActionResult> LayDanhSachNhapHang(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? tenSach = null,
            [FromQuery] int? idTheLoai = null,
            [FromQuery] long? idTaiKhoan = null,
            [FromQuery] DateTime? ngayNhapFrom = null,
            [FromQuery] DateTime? ngayNhapTo = null)
        {
            try
            {
                var query = _context.NhapHangs
                    .Include(nh => nh.IdTaiKhoanNavigation)
                    .Include(nh => nh.IdTheLoaiNavigation)
                    .AsQueryable();

                // ====== Áp dụng bộ lọc (tất cả đều tùy chọn) ======
                if (!string.IsNullOrWhiteSpace(tenSach))
                {
                    var keyword = tenSach.Trim();
                    query = query.Where(nh => nh.TenSach != null && nh.TenSach.Contains(keyword));
                }

                if (idTheLoai.HasValue)
                {
                    query = query.Where(nh => nh.IdTheLoai == idTheLoai.Value);
                }

                if (idTaiKhoan.HasValue)
                {
                    // Chỉ cho phép lọc theo tài khoản là Admin
                    query = query.Where(nh =>
                        nh.IdTaiKhoan == idTaiKhoan.Value &&
                        nh.IdTaiKhoanNavigation != null &&
                        nh.IdTaiKhoanNavigation.IsAdmin == true);
                }

                if (ngayNhapFrom.HasValue)
                {
                    var from = ngayNhapFrom.Value.Date;
                    query = query.Where(nh => nh.NgayNhap.HasValue && nh.NgayNhap.Value.Date >= from);
                }

                if (ngayNhapTo.HasValue)
                {
                    var to = ngayNhapTo.Value.Date;
                    query = query.Where(nh => nh.NgayNhap.HasValue && nh.NgayNhap.Value.Date <= to);
                }

                query = query.OrderByDescending(nh => nh.NgayNhap).ThenByDescending(nh => nh.Id);

                var totalCount = await query.CountAsync();

                var nhapHangs = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(nh => new NhapHangResponseDTO
                    {
                        Id = nh.Id,
                        IdTheLoai = nh.IdTheLoai,
                        TenTheLoai = nh.IdTheLoaiNavigation != null ? nh.IdTheLoaiNavigation.TenTheLoai : null,
                        TenSach = nh.TenSach,
                        SoLuongNhap = nh.SoLuongNhap,
                        GiaNhap = nh.GiaNhap,
                        IdTaiKhoan = nh.IdTaiKhoan,
                        TenTaiKhoan = nh.IdTaiKhoanNavigation != null ? nh.IdTaiKhoanNavigation.HovaTen : null,
                        EmailTaiKhoan = nh.IdTaiKhoanNavigation != null ? nh.IdTaiKhoanNavigation.Email : null,
                        NgayNhap = nh.NgayNhap,
                        ThanhTien = (nh.SoLuongNhap ?? 0) * (nh.GiaNhap ?? 0),
                        TonKhoBanDau = nh.TonKhoBanDau // thêm trường này
                    })
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Lấy danh sách nhập hàng thành công",
                    data = new
                    {
                        results = nhapHangs,
                        pagination = new
                        {
                            currentPage = page,
                            pageSize = pageSize,
                            totalCount = totalCount,
                            totalPages = totalPages,
                            hasNextPage = page < totalPages,
                            hasPreviousPage = page > 1
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi lấy danh sách nhập hàng: {ex.Message}" });
            }
        }

        // ✅ 1.1. Lấy danh sách giá trị lọc có sẵn (để FE render select)
        [Authorize(Roles = "Admin")]
        [HttpGet("NhapHang/Filters")]
        public async Task<IActionResult> LayBoLocNhapHang()
        {
            try
            {
                // TenSach distinct từ bảng NhapHang
                var tenSachs = await _context.NhapHangs
                    .Where(nh => nh.TenSach != null && nh.TenSach != "")
                    .Select(nh => nh.TenSach!)
                    .Distinct()
                    .OrderBy(s => s)
                    .ToListAsync();

                // Thể loại có phát sinh nhập (distinct theo Id)
                var theLoais = await _context.NhapHangs
                    .Where(nh => nh.IdTheLoai.HasValue)
                    .Select(nh => new { nh.IdTheLoai, Ten = nh.IdTheLoaiNavigation != null ? nh.IdTheLoaiNavigation.TenTheLoai : null })
                    .Distinct()
                    .ToListAsync();

                // Tài khoản Admin có phát sinh nhập (distinct)
                var taiKhoans = await _context.NhapHangs
                    .Where(nh => nh.IdTaiKhoan.HasValue
                                 && nh.IdTaiKhoanNavigation != null
                                 && nh.IdTaiKhoanNavigation.IsAdmin == true)
                    .Select(nh => new
                    {
                        Id = nh.IdTaiKhoan,
                      
                        Email = nh.IdTaiKhoanNavigation != null ? nh.IdTaiKhoanNavigation.Email : null
                    })
                    .Distinct()
                    .ToListAsync();

                // Ngày nhập (date-only) distinct, sắp xếp giảm dần
                var ngayNhaps = await _context.NhapHangs
                    .Where(nh => nh.NgayNhap.HasValue)
                    
                    .Distinct()
                    .OrderByDescending(d => d)
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    data = new
                    {
                        tenSachs,
                        theLoais,
                        taiKhoans,
                        ngayNhaps
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi lấy bộ lọc nhập hàng: {ex.Message}" });
            }
        }

        // ✅ 2. Lấy chi tiết 1 phiếu nhập hàng
        [Authorize(Roles = "Admin")]
        [HttpGet("NhapHang/{id}")]
        public async Task<IActionResult> LayChiTietNhapHang(long id)
        {
            try
            {
                var nhapHang = await _context.NhapHangs
                    .Include(nh => nh.IdTaiKhoanNavigation)
                    .Include(nh => nh.IdTheLoaiNavigation)
                    .FirstOrDefaultAsync(nh => nh.Id == id);

                if (nhapHang == null)
                {
                    return Ok(new { statusCode = 404, message = "Không tìm thấy phiếu nhập hàng" });
                }

                var result = new NhapHangResponseDTO
                {
                    Id = nhapHang.Id,
                    IdTheLoai = nhapHang.IdTheLoai,
                    TenTheLoai = nhapHang.IdTheLoaiNavigation != null ? nhapHang.IdTheLoaiNavigation.TenTheLoai : null,
                    TenSach = nhapHang.TenSach,
                    SoLuongNhap = nhapHang.SoLuongNhap,
                    GiaNhap = nhapHang.GiaNhap,
                    IdTaiKhoan = nhapHang.IdTaiKhoan,
                    TenTaiKhoan = nhapHang.IdTaiKhoanNavigation != null ? nhapHang.IdTaiKhoanNavigation.HovaTen : null,
                    EmailTaiKhoan = nhapHang.IdTaiKhoanNavigation != null ? nhapHang.IdTaiKhoanNavigation.Email : null,
                    NgayNhap = nhapHang.NgayNhap,
                    ThanhTien = (nhapHang.SoLuongNhap ?? 0) * (nhapHang.GiaNhap ?? 0)
                };

                return Ok(new { statusCode = 200, data = result });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi lấy chi tiết nhập hàng: {ex.Message}" });
            }
        }

        // ✅ 3. Thêm nhập hàng mới (và cộng số lượng vào sách) - ✅ ĐÃ SỬA: Lưu TonKhoBanDau
        [Authorize(Roles = "Admin")]
        [HttpPost("NhapHang/Them")]
        public async Task<IActionResult> ThemNhapHang([FromBody] NhapHangDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Ok(new { statusCode = 400, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }

                // Validation
                if (string.IsNullOrWhiteSpace(dto.TenSach))
                {
                    return Ok(new { statusCode = 400, message = "Tên sách không được để trống" });
                }

                if (dto.SoLuongNhap == null || dto.SoLuongNhap <= 0)
                {
                    return Ok(new { statusCode = 400, message = "Số lượng nhập phải lớn hơn 0" });
                }

                if (dto.GiaNhap == null || dto.GiaNhap <= 0)
                {
                    return Ok(new { statusCode = 400, message = "Giá nhập phải lớn hơn 0" });
                }

                // Lấy thông tin user từ token
                var userIdClaim = User?.FindFirst("TaiKhoanId")?.Value;
                if (string.IsNullOrWhiteSpace(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
                }

                // Tìm sách theo tên và thể loại
                var sach = await _context.Saches
                    .FirstOrDefaultAsync(s => s.TenSach == dto.TenSach && s.IdTheLoai == dto.IdTheLoai);

                if (sach == null)
                {
                    return Ok(new { statusCode = 404, message = $"Không tìm thấy sách '{dto.TenSach}' trong thể loại này" });
                }

                // Sử dụng transaction để đảm bảo tính nhất quán
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // ✅ LẤY TỒN KHO BAN ĐẦU TRƯỚC KHI CỘNG
                    var tonKho = await _context.TonKhos.FirstOrDefaultAsync(t => t.IdSach == sach.Id);
                    var tonKhoBanDau = tonKho?.SoLuong ?? 0;

                    // Tạo phiếu nhập hàng - ✅ LƯU TonKhoBanDau
                    var nhapHang = new NhapHang
                    {
                        IdTheLoai = dto.IdTheLoai,
                        TenSach = dto.TenSach,
                        SoLuongNhap = dto.SoLuongNhap,
                        GiaNhap = dto.GiaNhap,
                        IdTaiKhoan = userId,
                        NgayNhap = dto.NgayNhap ?? DateTime.Now,
                        TonKhoBanDau = tonKhoBanDau // ✅ LƯU TỒN KHO BAN ĐẦU
                    };

                    _context.NhapHangs.Add(nhapHang);

                    // Cộng số lượng vào tồn kho theo sách
                    if (tonKho == null)
                    {
                        tonKho = new TonKho { IdSach = sach.Id, SoLuong = 0 };
                        _context.TonKhos.Add(tonKho);
                    }
                    tonKho.SoLuong = (tonKho.SoLuong ?? 0) + dto.SoLuongNhap.Value;

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Thêm nhập hàng thành công và đã cộng số lượng vào sách",
                        data = new
                        {
                            id = nhapHang.Id,
                            tenSach = nhapHang.TenSach,
                            soLuongNhap = nhapHang.SoLuongNhap,
                            giaNhap = nhapHang.GiaNhap,
                            tonKhoBanDau = tonKhoBanDau,
                            soLuongTonKhoHienTai = tonKho.SoLuong
                        }
                    });
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi thêm nhập hàng: {ex.Message}" });
            }
        }

        

        // ✅ 5. Xóa nhập hàng (và trừ số lượng sách) - ✅ ĐÃ SỬA: Tính toán chính xác dựa trên TonKhoBanDau
        [Authorize(Roles = "Admin")]
        [HttpDelete("NhapHang/Xoa/{id}")]
        public async Task<IActionResult> XoaNhapHang(long id)
        {
            try
            {
                var nhapHang = await _context.NhapHangs
                    .Include(nh => nh.IdTheLoaiNavigation)
                    .FirstOrDefaultAsync(nh => nh.Id == id);

                if (nhapHang == null)
                {
                    return Ok(new { statusCode = 404, message = "Không tìm thấy phiếu nhập hàng" });
                }

                // Tìm sách
                var sach = await _context.Saches
                    .FirstOrDefaultAsync(s => s.TenSach == nhapHang.TenSach &&
                                             s.IdTheLoai == nhapHang.IdTheLoai);

                if (sach == null)
                {
                    _context.NhapHangs.Remove(nhapHang);
                    await _context.SaveChangesAsync();
                    return Ok(new { statusCode = 200, message = "Đã xóa phiếu nhập hàng (không tìm thấy sách)" });
                }

                // Sử dụng transaction
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var tonKho = await _context.TonKhos.FirstOrDefaultAsync(t => t.IdSach == sach.Id);
                    if (tonKho == null)
                    {
                        await transaction.RollbackAsync();
                        return Ok(new { statusCode = 400, message = "Không tìm thấy bản ghi tồn kho" });
                    }

                    var tenSach = nhapHang.TenSach;
                    var idTheLoai = nhapHang.IdTheLoai;
                    var soLuongNhap = nhapHang.SoLuongNhap ?? 0;
                    var tonKhoHienTai = tonKho.SoLuong ?? 0;

                    // ✅ XÓA NHẬP HÀNG TRƯỚC
                    _context.NhapHangs.Remove(nhapHang);
                    await _context.SaveChangesAsync();

                    // ✅ TÍNH LẠI TỒN KHO TỪ ĐẦU (ĐÚNG)
                    // Tổng nhập hàng còn lại (sau khi đã xóa)
                    var tongNhap = await _context.NhapHangs
                        .Where(nh => nh.TenSach == tenSach && nh.IdTheLoai == idTheLoai)
                        .SumAsync(nh => nh.SoLuongNhap ?? 0);

                    // ✅ Tính tổng xuất kho
                    // Cách 1: Nếu có bảng XuatKho riêng (uncomment nếu có)
                    /*
                    var tongXuat = await _context.XuatKhos
                        .Where(xk => xk.TenSach == tenSach)
                        .SumAsync(xk => xk.SoLuongXuat ?? 0);
                    */

                    // Cách 2: Tính từ sự chênh lệch (nếu không có bảng XuatKho riêng)
                    // Tổng nhập hàng ban đầu (trước khi xóa)
                    var tongNhapBanDau = tongNhap + soLuongNhap;

                    // Tính xuất kho từ sự chênh lệch: Tổng nhập - Tồn kho hiện tại
                    var tongXuat = tongNhapBanDau - tonKhoHienTai;
                    tongXuat = Math.Max(0, tongXuat); // Đảm bảo không âm

                    // ✅ CẬP NHẬT TỒN KHO
                    tonKho.SoLuong = tongNhap - tongXuat;

                    // Đảm bảo số lượng không âm
                    if (tonKho.SoLuong < 0)
                    {
                        await transaction.RollbackAsync();
                        return Ok(new { statusCode = 400, message = "Không thể xóa: Số lượng tồn kho sau khi trừ sẽ âm" });
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Xóa nhập hàng thành công và đã cập nhật tồn kho",
                        data = new
                        {
                            id = nhapHang.Id,
                            tenSach = tenSach,
                            soLuongNhapDaXoa = soLuongNhap,
                            tongNhapConLai = tongNhap,
                            tongXuat = tongXuat,
                            soLuongTonKhoHienTai = tonKho.SoLuong
                        }
                    });
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi xóa nhập hàng: {ex.Message}" });
            }
        
    }


    }
}
