using Azure.Core;
using cuoiky.Models;
using cuoiky.Services.VnpayServices;
using cuoiky.Services.VnpayServices.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VNPAY.NET;

using VNPAY.NET.Models;
using VNPAY.NET.Utilities;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DatHangController : ControllerBase
    {
        private readonly QuanLySachContext _context;
        private readonly IVnpay _vnpay;
        private readonly IConfiguration _configuration;
        public DatHangController(QuanLySachContext context, IVnpay vnPayservice, IConfiguration configuration)
        {
            _context = context;
            _vnpay = vnPayservice;
            _configuration = configuration;

            _vnpay.Initialize(_configuration["Vnpay:TmnCode"], _configuration["Vnpay:HashSecret"], _configuration["Vnpay:BaseUrl"], _configuration["Vnpay:CallbackUrl"]);
        }

        // ========== ADMIN ENDPOINTS ==========
        // GET: /api/DatHang/Admin/List?status=cho-xac-nhan|dang-giao|da-xac-nhan|da-huy
        [Authorize(Roles = "Admin")]
        [HttpGet("Admin/List")]
        public async Task<IActionResult> AdminList([FromQuery] string? status)
        {
            IQueryable<DonHang> query = _context.DonHangs
                .Include(d => d.ChiTietDonHangs).ThenInclude(c => c.IdSachNavigation)
                .Include(d => d.IdTaiKhoanNavigation)
                .Include(d => d.IdTrangThaiDonHangNavigation)
                .Include(d => d.LichSuThanhToans).ThenInclude(t => t.IdPhuongThucThanhToanNavigation)
                .Include(d => d.LichSuThanhToans).ThenInclude(t => t.TrangThai)
                .OrderByDescending(d => d.NgayDat);

            if (!string.IsNullOrWhiteSpace(status))
            {
                var statusId = ResolveStatusIdByAction(status);
                if (statusId.HasValue)
                {
                    query = query.Where(d => d.IdTrangThaiDonHang == statusId.Value);
                }
            }

            var donHangs = await query.ToListAsync();
            var result = donHangs.Select(d =>
            {
                var phiShip = d.PhiVanChuyen;
                var tongGoc = (d.TongTien ?? 0m) + phiShip;
                var giam = d.GiaTriGiam;
                var thanhTien = tongGoc - giam;

                var thanhToanGanNhat = d.LichSuThanhToans?
                    .OrderByDescending(t => t.NgayThanhToan)
                    .FirstOrDefault();

                var tenPhuongThuc = thanhToanGanNhat?.IdPhuongThucThanhToanNavigation?.TenPhuongThuc
                                    ?? "Không xác định";
                var tenTrangThaiThanhToan = thanhToanGanNhat?.TrangThai?.TenTrangThai
                                    ?? "Chưa thanh toán";

                return new OrderResponseDTO
                {
                    Id = d.Id,
                    MaDonHang = d.MaDonHang,
                    DiaChiGiaoHang = d.DiaChiGiaoHang ?? "",
                    PhuongThucThanhToan = tenPhuongThuc,
                    TenTrangThaiThanhToan = tenTrangThaiThanhToan,
                    TongTien = tongGoc,
                    GiaTriGiam = giam,
                    ThanhTien = thanhTien,
                    TrangThaiDonHang = d.IdTrangThaiDonHangNavigation?.TenTrangThai ?? "",
                    NgayDat = d.NgayDat?.ToDateTime(TimeOnly.MinValue) ?? DateTime.Now,
                    NgayGiao = d.NgayGiao?.ToDateTime(TimeOnly.MinValue),
                    PhiVanChuyen = phiShip,
                    HovaTen = d.IdTaiKhoanNavigation?.HovaTen ?? "",
                    SoDienThoai = d.IdTaiKhoanNavigation?.SoDienThoai ?? "",
                    DiaChi = d.IdTaiKhoanNavigation?.DiaChi ?? "",
                    ChiTietDonHang = d.ChiTietDonHangs.Select(c => new OrderItemDTO
                    {
                        IdSach = c.IdSach ?? 0,
                        TenSach = c.IdSachNavigation?.TenSach ?? "",
                        HinhAnh = c.IdSachNavigation?.HinhAnh,
                        Gia = c.Gia ?? 0,
                        SoLuong = c.SoLuong ?? 0,
                        ThanhTien = (c.Gia ?? 0) * (c.SoLuong ?? 0)
                    }).ToList()
                };
            }).ToList();

            return Ok(new { statusCode = 200, data = result });
        }

        // PATCH: /api/DatHang/Admin/XacNhan/{id}
        [Authorize(Roles = "Admin")]
        [HttpPatch("Admin/XacNhan/{id}")]
        public async Task<IActionResult> AdminXacNhan(long id)
        {
            var don = await _context.DonHangs.Include(d => d.IdTrangThaiDonHangNavigation).FirstOrDefaultAsync(d => d.Id == id);
            if (don == null)
            {
                return Ok(new { statusCode = 404, message = "Không tìm thấy đơn hàng" });
            }

            var statusId = ResolveStatusIdByAction("confirm"); // ✅ ĐÚNG - Đã xác nhận
            if (!statusId.HasValue)
            {
                return Ok(new { statusCode = 500, message = "Không xác định được trạng thái 'đã xác nhận'" });
            }

            don.IdTrangThaiDonHang = statusId.Value;
            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Xác nhận đơn hàng thành công" });
        }

        public class AdminHuyDonDTO { public string? LyDo { get; set; } }

        // PATCH: /api/DatHang/Admin/Huy/{id}
        [Authorize(Roles = "Admin")]
        [HttpPatch("Admin/Huy/{id}")]
        public async Task<IActionResult> AdminHuy(long id, [FromBody] AdminHuyDonDTO dto)
        {
            // 🟢 1. Cần Include ChiTietDonHangs để biết hủy sách nào mà hoàn kho
            var don = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs)
                .FirstOrDefaultAsync(d => d.Id == id);
            if (don == null)
            {
                return Ok(new { statusCode = 404, message = "Không tìm thấy đơn hàng" });
            }
            // 🟢 2. Kiểm tra nếu đã hủy rồi thì thôi, tránh cộng dồn kho nhiều lần
            var cancelStatusId = ResolveStatusIdByAction("cancel"); // 7
            if (don.IdTrangThaiDonHang == cancelStatusId)
            {
                return Ok(new { statusCode = 400, message = "Đơn hàng này đã được hủy trước đó" });
            }
            if (!cancelStatusId.HasValue)
            {
                return Ok(new { statusCode = 500, message = "Không xác định được trạng thái 'đã hủy'" });
            }
            // 🟢 3. Thực hiện hoàn kho
            if (don.ChiTietDonHangs != null)
            {
                foreach (var chiTiet in don.ChiTietDonHangs)
                {
                    if (chiTiet.IdSach != null)
                    {
                        var sach = await _context.Saches.FindAsync(chiTiet.IdSach);
                        if (sach != null)
                        {
                            sach.SoLuong += chiTiet.SoLuong ?? 0;
                        }
                    }
                }
            }
            don.IdTrangThaiDonHang = cancelStatusId.Value;
            // TODO: Lưu lý do hủy khi có cột trong DB

            await _context.SaveChangesAsync();
            return Ok(new { statusCode = 200, message = "Hủy đơn hàng thành công" });
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("Admin/UpdateStatus/{id}")]
        public async Task<IActionResult> AdminUpdateStatus(long id, [FromBody] UpdateStatusDTO dto)
        {
            // 🟢 1. Thêm Include ChiTietDonHangs
            var don = await _context.DonHangs
                .Include(d => d.IdTrangThaiDonHangNavigation)
                .Include(d => d.ChiTietDonHangs)
                .FirstOrDefaultAsync(d => d.Id == id);
            if (don == null)
            {
                return Ok(new { statusCode = 404, message = "Không tìm thấy đơn hàng" });
            }
            var statusId = ResolveStatusIdByAction(dto.Action);
            if (!statusId.HasValue)
            {
                return Ok(new { statusCode = 500, message = $"Action không hợp lệ: '{dto.Action}'" });
            }
            // 🟢 2. Logic hoàn kho nếu Action là hủy (ID = 7)
            if (statusId.Value == 7)
            {
                if (don.IdTrangThaiDonHang == 7)
                {
                    return Ok(new { statusCode = 400, message = "Đơn hàng đã được hủy trước đó" });
                }
                if (don.ChiTietDonHangs != null)
                {
                    foreach (var chiTiet in don.ChiTietDonHangs)
                    {
                        if (chiTiet.IdSach != null)
                        {
                            var sach = await _context.Saches.FindAsync(chiTiet.IdSach);
                            if (sach != null)
                            {
                                sach.SoLuong += chiTiet.SoLuong ?? 0;
                            }
                        }
                    }
                }
            }
            don.IdTrangThaiDonHang = statusId.Value;
            await _context.SaveChangesAsync();
            return Ok(new { statusCode = 200, message = "Cập nhật trạng thái thành công" });
        }

        public class UpdateStatusDTO
        {
            public string Action { get; set; } = ""; // "confirm", "prepare", "ship", "delivering", "delivered"
        }

        // Map trực tiếp theo Id trong bảng TrangThaiDonHangs:
        // 1: Chờ xác nhận, 2: Đã xác nhận, 3: Đang chuẩn bị, 4: Đã giao cho đơn vị VC,
        // 5: Đang giao đến bạn, 6: Đơn hàng đã giao, 7: Hủy đơn hàng
        private int? ResolveStatusIdByAction(string action)
        {
            return (action ?? string.Empty).Trim().ToLower() switch
            {
                "confirm"    => 2, // Đã xác nhận
                "prepare"    => 3, // Đang chuẩn bị hàng
                "ship"       => 4, // Đã giao cho đơn vị vận chuyển
                "delivering" => 5, // Đơn hàng đang giao đến bạn
                "delivered"  => 6, // Đơn hàng đã giao
                "cancel"     => 7, // Hủy đơn hàng
                // Support for status query parameter format
                "cho-xac-nhan" => 1, // Chờ xác nhận
                "da-xac-nhan"  => 2, // Đã xác nhận
                "dang-giao"    => 5, // Đang giao
                "da-huy"       => 7, // Đã hủy
                _ => (int?)null
            };
        }
        // ========== END ADMIN ENDPOINTS ==========
        [HttpPut("CancelOrder/{orderId}")]
        public async Task<IActionResult> CancelOrder(long orderId)
        {
            try
            {
                Console.WriteLine($"=== CANCEL ORDER DEBUG ===");
                Console.WriteLine($"OrderId: {orderId}");

                // 1. Lấy thông tin đơn hàng
                var order = await _context.DonHangs
                    .Include(dh => dh.ChiTietDonHangs)
                    .FirstOrDefaultAsync(dh => dh.Id == orderId);

                Console.WriteLine($"Order found: {order != null}");
                if (order != null)
                {
                    Console.WriteLine($"ChiTietDonHangs count: {order.ChiTietDonHangs.Count}");
                }

                if (order == null)
                    return Ok(new { statusCode = 404, message = "Không tìm thấy đơn hàng" });

                // 2. Cộng lại số lượng sách vào kho
                foreach (var chiTiet in order.ChiTietDonHangs)
                {
                    Console.WriteLine($"Processing ChiTiet: IdSach={chiTiet.IdSach}, SoLuong={chiTiet.SoLuong}");

                    var sach = await _context.Saches.FindAsync(chiTiet.IdSach);
                    if (sach != null)
                    {
                        Console.WriteLine($"Sach before: {sach.SoLuong}");
                        sach.SoLuong += chiTiet.SoLuong;
                        Console.WriteLine($"Sach after: {sach.SoLuong}");
                    }
                    else
                    {
                        Console.WriteLine($"Sach not found for IdSach: {chiTiet.IdSach}");
                    }
                }

                // 3. Cập nhật trạng thái đơn hàng
                order.IdTrangThaiDonHang = 7; // Đã hủy

                // 4. Lưu thay đổi
                await _context.SaveChangesAsync();
                Console.WriteLine($"=== SAVE CHANGES COMPLETED ===");

                return Ok(new { statusCode = 200, message = "Đã hủy đơn hàng và cộng lại số lượng sách" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: {ex.Message}");
                return Ok(new { statusCode = 500, message = $"Lỗi: {ex.Message}" });
            }
        }
        // ✅ 1. Lấy thông tin địa chỉ user hiện tại
        [HttpGet("LayDiaChiUser")]
        public async Task<IActionResult> LayDiaChiUser()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }

            var user = await _context.TaiKhoans.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy tài khoản" });
            }

            var diaChi = new UserAddressDTO
            {
                DiaChi = user.DiaChi ?? "",
                Email = user.Email,
                SoDienThoai = user.SoDienThoai,
                HovaTen = user.HovaTen ?? "",
                SoCCCD = user.SoCccd ?? ""
            };

            return Ok(new { statusCode = 200, data = diaChi });
        }

        [HttpPost("DatHang")]
        public async Task<IActionResult> DatHang([FromBody] CreateOrderDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return Ok(new { statusCode = 400, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }

            var gioHang = await _context.GioHangs
                .Include(g => g.ChiTietGioHangs)
                .ThenInclude(c => c.IdSachNavigation)
                .FirstOrDefaultAsync(g => g.IdTaiKhoan == userId);

            if (gioHang == null || !gioHang.ChiTietGioHangs.Any())
            {
                return Ok(new { statusCode = 400, message = "Giỏ hàng trống" });
            }

            decimal tongTien = 0; // tiền hàng
            foreach (var item in gioHang.ChiTietGioHangs)
            {
                tongTien += (item.Gia ?? 0) * (item.SoLuong ?? 0);
            }

            // Lấy thông tin user và cập nhật nếu có
            var user = await _context.TaiKhoans.FindAsync(userId);
            if (user != null)
            {
                if (!string.IsNullOrEmpty(dto.HovaTen)) user.HovaTen = dto.HovaTen;
                if (!string.IsNullOrEmpty(dto.SoDienThoai)) user.SoDienThoai = dto.SoDienThoai;
                _context.TaiKhoans.Update(user);
                await _context.SaveChangesAsync();
            }
            user = await _context.TaiKhoans.FindAsync(userId);

            // Tính phí ship + ngày giao trước, để giảm giá áp trên (hàng + ship)
            var ngayDat = DateOnly.FromDateTime(DateTime.Now);
            var diaChiGiaoHang = dto.DiaChiGiaoHang ?? "";
            var (ngayGiao, phiVanChuyen) = TinhNgayGiaoVaPhiVanChuyen(diaChiGiaoHang, ngayDat);

            // Tổng cộng trước giảm (nền tính giảm)
            var tongCongTruocGiam = tongTien + phiVanChuyen;

            // Tính giảm giá TRÊN (hàng + ship)
            decimal giaTriGiam = 0m;
            if (!string.IsNullOrEmpty(dto.MaGiamGia))
            {
                var today = DateOnly.FromDateTime(DateTime.Now);
                var phieuGiamGia = await _context.PhieuGiamGia
                    .FirstOrDefaultAsync(p => p.MaGiamGia == dto.MaGiamGia && p.NgayKetThuc >= today);

                if (phieuGiamGia == null)
                {
                    return Ok(new { statusCode = 400, message = "Mã giảm giá không hợp lệ hoặc đã hết hạn" });
                }

                var daSuDung = await _context.ChiTietPhieuGiamGia
                    .AnyAsync(c => c.IdTaiKhoan == userId && c.IdGiamGia == phieuGiamGia.Id);

                if (daSuDung)
                {
                    return Ok(new { statusCode = 400, message = "Bạn đã sử dụng mã giảm giá này rồi" });
                }

                if (phieuGiamGia.LoaiPhieuGiamGia == "Phần trăm")
                {
                    giaTriGiam = (tongCongTruocGiam * phieuGiamGia.GiaTriGiam) / 100m;
                }
                else
                {
                    giaTriGiam = phieuGiamGia.GiaTriGiam;
                }

                if (giaTriGiam > tongCongTruocGiam) giaTriGiam = tongCongTruocGiam;
            }

            // Thành tiền cuối cùng
            decimal thanhTien = tongCongTruocGiam - giaTriGiam;
            if (thanhTien < 0) thanhTien = 0;

            // Tạo đơn hàng
            var donHang = new DonHang
            {
                MaDonHang = GenerateOrderCode(),
                IdTaiKhoan = userId.Value,
                DiaChiGiaoHang = dto.DiaChiGiaoHang,
                TongTien = tongTien,
                GiaTriGiam = giaTriGiam,
                NgayDat = ngayDat,
                IdTrangThaiDonHang = 1,
                HovaTen = !string.IsNullOrEmpty(dto.HovaTen) ? dto.HovaTen : (user?.HovaTen ?? ""),
                SoDienThoai = !string.IsNullOrEmpty(dto.SoDienThoai) ? dto.SoDienThoai : (user?.SoDienThoai ?? ""),
                NgayGiao = ngayGiao,
                PhiVanChuyen = phiVanChuyen
            };

            _context.DonHangs.Add(donHang);
            await _context.SaveChangesAsync();

            // Lưu chi tiết đơn và đặt sách
            var ngayDatSach = DateTime.Now;
            foreach (var item in gioHang.ChiTietGioHangs)
            {
                _context.ChiTietDonHangs.Add(new ChiTietDonHang
                {
                    IdDonHang = donHang.Id,
                    IdSach = item.IdSach,
                    SoLuong = item.SoLuong,
                    Gia = item.Gia
                });

                _context.DatSaches.Add(new DatSach
                {
                    IdSach = item.IdSach,
                    IdTaiKhoan = userId.Value,
                    NgayDat = ngayDatSach
                });

                var sach = await _context.Saches.FindAsync(item.IdSach);
                if (sach != null) sach.SoLuong -= item.SoLuong;
            }

            // Lưu lịch sử sử dụng mã
            if (!string.IsNullOrEmpty(dto.MaGiamGia))
            {
                var phieuGiamGia = await _context.PhieuGiamGia.FirstOrDefaultAsync(p => p.MaGiamGia == dto.MaGiamGia);
                var chiTietPhieuGiamGia = new ChiTietPhieuGiamGium
                {
                    IdGiamGia = phieuGiamGia!.Id,
                    IdTaiKhoan = userId.Value,
                    NgaySuDung = DateOnly.FromDateTime(DateTime.Now)
                };
                _context.ChiTietPhieuGiamGia.Add(chiTietPhieuGiamGia);
            }

            _context.ChiTietGioHangs.RemoveRange(gioHang.ChiTietGioHangs);

            var pthucThanhToan = dto.PhuongThucThanhToan == "COD" ? 1
                              : dto.PhuongThucThanhToan == "VNPAY" ? 2
                              : 0;

            var trangThaiThanhToanId = dto.PhuongThucThanhToan == "VNPAY" ? 1 : 2;

            // Lưu thanh toán
            var thanhToan = new LichSuThanhToan
            {
                MaThanhToan = Guid.NewGuid().ToString(),
                IdTaiKhoan = userId.Value,
                SoTien = thanhTien,
                IdPhuongThucThanhToan = pthucThanhToan,
                NgayThanhToan = DateTime.Now,
                TrangThaiId = 2,
                IdDonHang = donHang.Id
            };
            _context.LichSuThanhToans.Add(thanhToan);
            await _context.SaveChangesAsync();

            if (dto.PhuongThucThanhToan == "VNPAY")
            {
                try
                {
                    var ipAddress = NetworkHelper.GetIpAddress(HttpContext);
                    var state = "ANHKHOI";
                    var requestVnpay = new PaymentRequest
                    {
                        PaymentId = thanhToan.Id,
                        Money = (double)thanhTien,
                        Description = "Thanh toán đặt sach!",
                        IpAddress = ipAddress,
                        CreatedDate = DateTime.Now,
                        Currency = Currency.VND,
                        Language = DisplayLanguage.Vietnamese
                    };
                    var paymentUrl = _vnpay.GetPaymentUrl(requestVnpay);
                    return Ok(new
                    {
                        statusCode = 201,
                        message = "Tạo đơn hàng thành công!",
                        url = paymentUrl,
                        state = state
                    });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { statusCode = 500, message = ex.Message });
                }
            }

            // Response
            user = await _context.TaiKhoans.FindAsync(userId);
            var response = new OrderResponseDTO
            {
                Id = donHang.Id,
                MaDonHang = donHang.MaDonHang,
                DiaChiGiaoHang = donHang.DiaChiGiaoHang ?? "",
                PhuongThucThanhToan = dto.PhuongThucThanhToan,
                TongTien = tongTien,
                GiaTriGiam = giaTriGiam,
                ThanhTien = thanhTien,
                TrangThaiDonHang = "Chờ xác nhận",
                NgayDat = DateTime.Now,
                HovaTen = donHang.HovaTen ?? "",
                SoDienThoai = donHang.SoDienThoai ?? "",
                DiaChi = user?.DiaChi ?? "",
                ChiTietDonHang = gioHang.ChiTietGioHangs.Select(c => new OrderItemDTO
                {
                    IdSach = c.IdSach ?? 0,
                    TenSach = c.IdSachNavigation != null ? c.IdSachNavigation.TenSach ?? "" : "",
                    HinhAnh = c.HinhAnh,
                    Gia = c.Gia ?? 0,
                    SoLuong = c.SoLuong ?? 0,
                    ThanhTien = (c.Gia ?? 0) * (c.SoLuong ?? 0)
                }).ToList()
            };

            return Ok(new { statusCode = 200, message = "Đặt hàng thành công", data = response });
        }

        [HttpGet("LayDonHangCuaUser")]
        public async Task<IActionResult> LayDonHangCuaUser()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }

            var donHangs = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(c => c.IdSachNavigation)
                .Include(d => d.IdTaiKhoanNavigation)
                .Include(d => d.IdTrangThaiDonHangNavigation)
                .Include(d => d.LichSuThanhToans)
                    .ThenInclude(t => t.IdPhuongThucThanhToanNavigation)
                .Include(d => d.LichSuThanhToans) // ✅ Thêm lại để include TrangThai
                    .ThenInclude(t => t.TrangThai) // ✅ Sử dụng tên navigation property đúng (có thể là TrangThai hoặc IdTrangThaiNavigation)
                .Where(d => d.IdTaiKhoan == userId)
                .OrderByDescending(d => d.NgayDat)
                .ToListAsync();

            var result = new List<OrderResponseDTO>();

            foreach (var d in donHangs)
            {
                var tienHang = d.TongTien ?? 0m;
                var phiShip = d.PhiVanChuyen;
                var tongGoc = tienHang + phiShip;
                var giam = d.GiaTriGiam;
                var thanhTien = tongGoc - giam;

                // Lấy bản ghi thanh toán mới nhất của đơn (nếu có)
                var thanhToanGanNhat = d.LichSuThanhToans?
                    .OrderByDescending(t => t.NgayThanhToan)
                    .FirstOrDefault();

                var tenPhuongThuc = thanhToanGanNhat?.IdPhuongThucThanhToanNavigation?.TenPhuongThuc
                                    ?? "Không xác định";

                // ✅ Sửa lại: Chỉ sử dụng TrangThai (bỏ dòng fallback gây lỗi)
                var tentrangthai = thanhToanGanNhat?.TrangThai?.TenTrangThai
                                  ?? "Chưa thanh toán";

                var orderResponse = new OrderResponseDTO
                {
                    Id = d.Id,
                    MaDonHang = d.MaDonHang,
                    DiaChiGiaoHang = d.DiaChiGiaoHang ?? "",
                    PhuongThucThanhToan = tenPhuongThuc,
                    TenTrangThaiThanhToan = tentrangthai,
                    TongTien = tongGoc,
                    GiaTriGiam = giam,
                    ThanhTien = thanhTien,
                    TrangThaiDonHang = d.IdTrangThaiDonHangNavigation != null
                        ? d.IdTrangThaiDonHangNavigation.TenTrangThai ?? "Chờ xác nhận"
                        : "Chờ xác nhận",
                    NgayDat = d.NgayDat.HasValue
                        ? d.NgayDat.Value.ToDateTime(TimeOnly.MinValue)
                        : DateTime.Now,
                    NgayGiao = d.NgayGiao.HasValue
                        ? d.NgayGiao.Value.ToDateTime(TimeOnly.MinValue)
                        : (DateTime?)null,
                    PhiVanChuyen = phiShip,
                    HovaTen = !string.IsNullOrEmpty(d.HovaTen)
                        ? d.HovaTen
                        : (d.IdTaiKhoanNavigation?.HovaTen ?? ""),
                    SoDienThoai = !string.IsNullOrEmpty(d.SoDienThoai)
                        ? d.SoDienThoai
                        : (d.IdTaiKhoanNavigation?.SoDienThoai ?? ""),
                    DiaChi = d.IdTaiKhoanNavigation?.DiaChi ?? "",
                    ChiTietDonHang = d.ChiTietDonHangs.Select(c => new OrderItemDTO
                    {
                        IdSach = c.IdSach ?? 0,
                        TenSach = c.IdSachNavigation?.TenSach ?? "",
                        HinhAnh = c.IdSachNavigation?.HinhAnh,
                        Gia = c.Gia ?? 0,
                        SoLuong = c.SoLuong ?? 0,
                        ThanhTien = (c.Gia ?? 0) * (c.SoLuong ?? 0)
                    }).ToList()
                };

                result.Add(orderResponse);
            }

            return Ok(new { statusCode = 200, data = result });
        }

        // ✅ User: Hủy đơn hàng
        [HttpPut("HuyDonHang/{orderId}")]
        public async Task<IActionResult> HuyDonHang(long orderId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
                }

                // 1. Lấy thông tin đơn hàng
                var order = await _context.DonHangs
                    .Include(dh => dh.ChiTietDonHangs)
                    .ThenInclude(c => c.IdSachNavigation)
                    .Include(dh => dh.IdTrangThaiDonHangNavigation)
                    .FirstOrDefaultAsync(dh => dh.Id == orderId && dh.IdTaiKhoan == userId);

                if (order == null)
                {
                    return Ok(new { statusCode = 404, message = "Không tìm thấy đơn hàng hoặc bạn không có quyền hủy đơn hàng này" });
                }

                // 2. Kiểm tra trạng thái đơn hàng - SỬA LẠI LOGIC NÀY
                if (order.IdTrangThaiDonHang >= 4)
                {
                    string message = order.IdTrangThaiDonHang switch
                    {
                        4 => "Đơn hàng đã được giao cho đơn vị vận chuyển, không thể hủy",
                        5 => "Đơn hàng đang giao đến bạn, không thể hủy",
                        6 => "Đơn hàng đã giao hàng, không thể hủy",
                        7 => "Đơn hàng đã được hủy trước đó",
                        _ => "Đơn hàng không thể hủy do trạng thái hiện tại"
                    };
                    return Ok(new { statusCode = 400, message = message });
                }

                // 3. Kiểm tra đã hủy chưa (thực ra đã check ở trên rồi)
                if (order.IdTrangThaiDonHang == 7)
                {
                    return Ok(new { statusCode = 400, message = "Đơn hàng đã được hủy trước đó" });
                }

                // 4. Chỉ cho phép hủy khi ID <= 3
                if (order.IdTrangThaiDonHang <= 3)
                {
                    // Sử dụng Transaction để đảm bảo tính nhất quán
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Cộng lại số lượng sách vào kho
                        foreach (var chiTiet in order.ChiTietDonHangs)
                        {
                            var sach = await _context.Saches.FindAsync(chiTiet.IdSach);
                            if (sach != null)
                            {
                                sach.SoLuong += chiTiet.SoLuong ?? 0;
                            }
                        }

                        // Cập nhật trạng thái đơn hàng thành "Hủy đơn hàng" (ID = 7)
                        order.IdTrangThaiDonHang = 7;

                        // Lưu thay đổi
                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        return Ok(new { statusCode = 200, message = "Đã hủy đơn hàng và cộng lại số lượng sách vào kho" });
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                }

                // Nếu không thuộc trường hợp nào trên
                return Ok(new { statusCode = 400, message = "Trạng thái đơn hàng không hợp lệ để hủy" });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi hủy đơn hàng: {ex.Message}" });
            }
        }

        // ✅ Helper method để lấy User ID từ token
        private long? GetCurrentUserId()
        {
            var userIdClaim = User?.FindFirst("TaiKhoanId")?.Value;
            if (long.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }

        // ✅ Helper method để tạo mã đơn hàng
        private string GenerateOrderCode()
        {
            return "DH" + DateTime.Now.ToString("yyyyMMddHHmmss");
        }
        // ✅ HELPER METHOD: Tính toán NgayGiao và PhiVanChuyen dựa trên địa chỉ giao hàng
        // Sử dụng danh sách 34 tỉnh thành sau sát nhập 2025
        private (DateOnly? ngayGiao, decimal phiVanChuyen) TinhNgayGiaoVaPhiVanChuyen(string diaChiGiaoHang, DateOnly ngayDat)
        {
            if (string.IsNullOrWhiteSpace(diaChiGiaoHang))
            {
                // Mặc định nếu không có địa chỉ
                return (ngayDat.AddDays(2), 25000); // Mặc định miền Nam
            }

            var diaChiLower = diaChiGiaoHang.ToLower();
            DateOnly? ngayGiao = null;
            decimal phiVanChuyen = 0;

            // ✅ Tp.HCM (nội thành) - NgayDat + 1, 15,000 VNĐ
            if (diaChiLower.Contains("tp. hồ chí minh") ||
                diaChiLower.Contains("tp hồ chí minh") ||
                diaChiLower.Contains("thành phố hồ chí minh") ||
                diaChiLower.Contains("hồ chí minh") ||
                diaChiLower.Contains("ho chi minh") ||
                diaChiLower.Contains("sài gòn") ||
                diaChiLower.Contains("saigon") ||
                diaChiLower.Contains("tp.hcm") ||
                diaChiLower.Contains("tp hcm"))
            {
                ngayGiao = ngayDat.AddDays(1);
                phiVanChuyen = 15000;
            }
            // ✅ Miền Nam (không phải nội thành) - NgayDat + 2, 25,000 VNĐ
            else if (diaChiLower.Contains("cần thơ") || diaChiLower.Contains("can tho"))
            {
                ngayGiao = ngayDat.AddDays(2);
                phiVanChuyen = 25000;
            }
            // ✅ Miền Trung - NgayDat + 3, 35,000 VNĐ
            else if (diaChiLower.Contains("huế") || diaChiLower.Contains("hue") ||
                     diaChiLower.Contains("quảng bình") || diaChiLower.Contains("quang binh") ||
                     diaChiLower.Contains("quảng trị") || diaChiLower.Contains("quang tri") ||
                     diaChiLower.Contains("thừa thiên huế") || diaChiLower.Contains("thua thien hue") ||
                     diaChiLower.Contains("đà nẵng") || diaChiLower.Contains("da nang") ||
                     diaChiLower.Contains("quảng nam") || diaChiLower.Contains("quang nam") ||
                     diaChiLower.Contains("quảng ngãi") || diaChiLower.Contains("quang ngai") ||
                     diaChiLower.Contains("bình định") || diaChiLower.Contains("binh dinh") ||
                     diaChiLower.Contains("phú yên") || diaChiLower.Contains("phu yen") ||
                     diaChiLower.Contains("khánh hòa") || diaChiLower.Contains("khanh hoa") ||
                     diaChiLower.Contains("ninh thuận") || diaChiLower.Contains("ninh thuan") ||
                     diaChiLower.Contains("bình thuận") || diaChiLower.Contains("binh thuan") ||
                     diaChiLower.Contains("lâm đồng") || diaChiLower.Contains("lam dong"))
            {
                ngayGiao = ngayDat.AddDays(3);
                phiVanChuyen = 35000;
            }
            // ✅ Miền Bắc - NgayDat + 4, 45,000 VNĐ
            else if (diaChiLower.Contains("hà nội") || diaChiLower.Contains("ha noi") ||
                     diaChiLower.Contains("hải phòng") || diaChiLower.Contains("hai phong") ||
                     diaChiLower.Contains("quảng ninh") || diaChiLower.Contains("quang ninh") ||
                     diaChiLower.Contains("lạng sơn") || diaChiLower.Contains("lang son") ||
                     diaChiLower.Contains("cao bằng") || diaChiLower.Contains("cao bang") ||
                     diaChiLower.Contains("bắc kạn") || diaChiLower.Contains("bac kan") ||
                     diaChiLower.Contains("thái nguyên") || diaChiLower.Contains("thai nguyen") ||
                     diaChiLower.Contains("phú thọ") || diaChiLower.Contains("phu tho") ||
                     diaChiLower.Contains("vĩnh phúc") || diaChiLower.Contains("vinh phuc") ||
                     diaChiLower.Contains("bắc giang") || diaChiLower.Contains("bac giang") ||
                     diaChiLower.Contains("bắc ninh") || diaChiLower.Contains("bac ninh") ||
                     diaChiLower.Contains("hải dương") || diaChiLower.Contains("hai duong") ||
                     diaChiLower.Contains("hưng yên") || diaChiLower.Contains("hung yen") ||
                     diaChiLower.Contains("hà nam") || diaChiLower.Contains("ha nam") ||
                     diaChiLower.Contains("nam định") || diaChiLower.Contains("nam dinh") ||
                     diaChiLower.Contains("ninh bình") || diaChiLower.Contains("ninh binh") ||
                     diaChiLower.Contains("thanh hóa") || diaChiLower.Contains("thanh hoa") ||
                     diaChiLower.Contains("nghệ an") || diaChiLower.Contains("nghe an") ||
                     diaChiLower.Contains("hà tĩnh") || diaChiLower.Contains("ha tinh"))
            {
                ngayGiao = ngayDat.AddDays(4);
                phiVanChuyen = 45000;
            }
            // Mặc định: coi như miền Nam
            else
            {
                ngayGiao = ngayDat.AddDays(2);
                phiVanChuyen = 25000;
            }

            return (ngayGiao, phiVanChuyen);
        }

    }
}
