using cuoiky.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PhieuGiamGiaController : ControllerBase
    {
        private readonly QuanLySachContext _context;

        public PhieuGiamGiaController(QuanLySachContext context)
        {
            _context = context;
        }

        // ✅ 1. Admin: Tạo phiếu giảm giá mới
        [Authorize(Roles = "Admin")]
        [HttpPost("Admin/Create")]
        public async Task<IActionResult> CreatePhieuGiamGia([FromBody] CreatePhieuGiamGiaDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return Ok(new { statusCode = 400, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            // Kiểm tra mã giảm giá đã tồn tại chưa
            var existingPhieu = await _context.PhieuGiamGia
                .FirstOrDefaultAsync(p => p.MaGiamGia == dto.MaGiamGia);

            if (existingPhieu != null)
            {
                return Ok(new { statusCode = 400, message = "Mã giảm giá đã tồn tại" });
            }

            // Kiểm tra ngày kết thúc phải sau ngày hiện tại
            if (dto.NgayKetThuc <= DateTime.Now)
            {
                return Ok(new { statusCode = 400, message = "Ngày kết thúc phải sau ngày hiện tại" });
            }

            var phieuGiamGia = new PhieuGiamGium
            {
                MaGiamGia = dto.MaGiamGia,
                GiaTriGiam = dto.GiaTriGiam,
                NgayKetThuc = DateOnly.FromDateTime(dto.NgayKetThuc),
                LoaiPhieuGiamGia = dto.LoaiPhieuGiamGia,
                DieuKienGiamGia = dto.DieuKienGiamGia,
                NoiDung = dto.NoiDung
            };

            _context.PhieuGiamGia.Add(phieuGiamGia);
            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Tạo phiếu giảm giá thành công" });
        }

        // ✅ 2. Admin: Lấy danh sách tất cả phiếu giảm giá
        [Authorize(Roles = "Admin")]
        [HttpGet("Admin/List")]
        public async Task<IActionResult> GetAdminList()
        {
            var phieuGiamGia = await _context.PhieuGiamGia
                .OrderByDescending(p => p.NgayKetThuc)
                .Select(p => new PhieuGiamGiaResponseDTO
                {
                    Id = p.Id,
                    MaGiamGia = p.MaGiamGia,
                    GiaTriGiam = p.GiaTriGiam,
                    NgayKetThuc = p.NgayKetThuc.ToDateTime(TimeOnly.MinValue),
                    LoaiPhieuGiamGia = p.LoaiPhieuGiamGia,
                    DieuKienGiamGia = p.DieuKienGiamGia,
                    NoiDung = p.NoiDung,
                    IsValid = p.NgayKetThuc >= DateOnly.FromDateTime(DateTime.Now),
                    DaysRemaining = (p.NgayKetThuc.ToDateTime(TimeOnly.MinValue) - DateTime.Now).Days
                })
                .ToListAsync();

            return Ok(new { statusCode = 200, data = phieuGiamGia });
        }

        // ✅ 3. User: Lấy danh sách phiếu giảm giá còn hiệu lực
        [HttpGet("User/List")]
        public async Task<IActionResult> GetUserList()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            
            var phieuGiamGia = await _context.PhieuGiamGia
                .Where(p => p.NgayKetThuc >= today)
                .OrderByDescending(p => p.GiaTriGiam)
                .Select(p => new PhieuGiamGiaResponseDTO
                {
                    Id = p.Id,
                    MaGiamGia = p.MaGiamGia,
                    GiaTriGiam = p.GiaTriGiam,
                    NgayKetThuc = p.NgayKetThuc.ToDateTime(TimeOnly.MinValue),
                    LoaiPhieuGiamGia = p.LoaiPhieuGiamGia,
                    DieuKienGiamGia = p.DieuKienGiamGia,
                    NoiDung = p.NoiDung,
                    IsValid = true,
                    DaysRemaining = (p.NgayKetThuc.ToDateTime(TimeOnly.MinValue) - DateTime.Now).Days
                })
                .ToListAsync();

            return Ok(new { statusCode = 200, data = phieuGiamGia });
        }

        // ✅ 4. User: Kiểm tra và áp dụng phiếu giảm giá
        [Authorize]
        [HttpPost("User/Apply")]
        public async Task<IActionResult> ApplyPhieuGiamGia([FromBody] ApplyPhieuGiamGiaDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return Ok(new
                {
                    statusCode = 400,
                    errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }

            // Lấy thông tin user
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }

            // Tìm phiếu giảm giá
            var phieuGiamGia = await _context.PhieuGiamGia
                .FirstOrDefaultAsync(p => p.MaGiamGia == dto.MaGiamGia);

            if (phieuGiamGia == null)
            {
                return Ok(new { statusCode = 404, message = "Mã giảm giá không tồn tại" });
            }

            // Kiểm tra phiếu còn hiệu lực
            if (phieuGiamGia.NgayKetThuc < DateOnly.FromDateTime(DateTime.Now))
            {
                return Ok(new { statusCode = 400, message = "Mã giảm giá đã hết hạn" });
            }

            // Kiểm tra user đã sử dụng mã này chưa
            var daSuDung = await _context.ChiTietPhieuGiamGia
                .AnyAsync(c => c.IdTaiKhoan == userId && c.IdGiamGia == phieuGiamGia.Id);

            if (daSuDung)
            {
                return Ok(new { statusCode = 400, message = "Bạn đã sử dụng mã giảm giá này rồi" });
            }

            // Kiểm tra điều kiện giảm giá (nếu có)
            if (!string.IsNullOrEmpty(phieuGiamGia.DieuKienGiamGia))
            {
                var dieuKien = phieuGiamGia.DieuKienGiamGia.ToLower();

                // Debug
                Console.WriteLine($"🔍 DieuKienGiamGia: {phieuGiamGia.DieuKienGiamGia}");
                Console.WriteLine($"🔍 TongTienDonHang (tiền hàng): {dto.TongTienDonHang}");
                Console.WriteLine($"🔍 PhiVanChuyen: {dto.PhiVanChuyen ?? 0m}");

                // Kiểm tra đơn hàng tối thiểu
                if (dieuKien.Contains("đơn hàng tối thiểu") || dieuKien.Contains("tối thiểu"))
                {
                    var regex = new System.Text.RegularExpressions.Regex(
                        @"(\d+(?:[.,]\d+)*)\s*(?:k|nghìn|triệu|đ|vnđ)?",
                        System.Text.RegularExpressions.RegexOptions.IgnoreCase
                    );
                    var match = regex.Match(dieuKien);

                    if (match.Success)
                    {
                        var amountStr = match.Groups[1].Value;
                        var cleanAmountStr = amountStr.Replace(".", "").Replace(",", "");
                        var minAmount = decimal.Parse(cleanAmountStr);

                        if (dieuKien.Contains("k") || dieuKien.Contains("nghìn"))
                            minAmount *= 1000;
                        else if (dieuKien.Contains("triệu"))
                            minAmount *= 1_000_000;

                        // Nền so sánh có thể là tổng cộng (tiền hàng + ship) hoặc chỉ tiền hàng tùy quy định.
                        // Ở đây vẫn kiểm tra tối thiểu theo TIỀN HÀNG (dto.TongTienDonHang). Nếu muốn theo tổng cộng thì đổi biến so sánh.
                        if (dto.TongTienDonHang < minAmount)
                        {
                            return Ok(new
                            {
                                statusCode = 400,
                                message = $"Mã giảm giá yêu cầu đơn hàng tối thiểu {minAmount:N0}đ. Đơn hàng hiện tại: {dto.TongTienDonHang:N0}đ"
                            });
                        }
                    }
                }

                // Điều kiện khác ví dụ cuối tuần
                if (dieuKien.Contains("chỉ áp dụng vào cuối tuần") || dieuKien.Contains("cuối tuần"))
                {
                    var dayOfWeek = DateTime.Now.DayOfWeek;
                    if (dayOfWeek != DayOfWeek.Saturday && dayOfWeek != DayOfWeek.Sunday)
                    {
                        return Ok(new
                        {
                            statusCode = 400,
                            message = "Mã giảm giá này chỉ áp dụng vào cuối tuần"
                        });
                    }
                }
            }

            // ✅ TÍNH GIẢM GIÁ TRÊN TỔNG CỘNG = (tiền hàng + phí ship)
            var phiVanChuyen = dto.PhiVanChuyen ?? 0m;
            var tongCongTamTinh = dto.TongTienDonHang + phiVanChuyen;

            decimal giaTriGiam = 0m;
            decimal thanhTienSauGiam = 0m;

            if (phieuGiamGia.LoaiPhieuGiamGia == "Phần trăm")
            {
                giaTriGiam = (tongCongTamTinh * phieuGiamGia.GiaTriGiam) / 100m;
            }
            else
            {
                giaTriGiam = phieuGiamGia.GiaTriGiam;
            }

            // Chặn trần giảm không vượt tổng cộng
            if (giaTriGiam > tongCongTamTinh) giaTriGiam = tongCongTamTinh;

            thanhTienSauGiam = tongCongTamTinh - giaTriGiam;

            if (thanhTienSauGiam < 0m)
            {
                thanhTienSauGiam = 0m;
                giaTriGiam = tongCongTamTinh;
            }

            return Ok(new
            {
                statusCode = 200,
                message = "Áp dụng mã giảm giá thành công",
                data = new
                {
                    maGiamGia = phieuGiamGia.MaGiamGia,
                    giaTriGiam = giaTriGiam,
                    // ✅ Tổng gốc là (tiền hàng + phí ship)
                    tongTienGoc = tongCongTamTinh,
                    thanhTienSauGiam = thanhTienSauGiam,
                    noiDung = phieuGiamGia.NoiDung,
                    loaiPhieuGiamGia = phieuGiamGia.LoaiPhieuGiamGia
                }
            });
        }

        // ✅ 5. Admin: Xóa phiếu giảm giá
        [Authorize(Roles = "Admin")]
        [HttpDelete("Admin/{id}")]
        public async Task<IActionResult> DeletePhieuGiamGia(long id)
        {
            try
            {
                var phieuGiamGia = await _context.PhieuGiamGia.FindAsync(id);
                if (phieuGiamGia == null)
                {
                    return Ok(new { statusCode = 404, message = "Không tìm thấy phiếu giảm giá" });
                }

                // Kiểm tra xem phiếu đã được sử dụng chưa
                var daSuDung = await _context.ChiTietPhieuGiamGia
                    .AnyAsync(c => c.IdGiamGia == phieuGiamGia.Id);

                if (daSuDung)
                {
                    return Ok(new { 
                        statusCode = 400, 
                        message = "Không thể xóa phiếu giảm giá đã được sử dụng" 
                    });
                }

                _context.PhieuGiamGia.Remove(phieuGiamGia);
                await _context.SaveChangesAsync();

                return Ok(new { statusCode = 200, message = "Xóa phiếu giảm giá thành công" });
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết
                Console.WriteLine($"Error deleting phieu giam gia: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return Ok(new { 
                    statusCode = 500, 
                    message = "Lỗi server khi xóa phiếu giảm giá",
                    details = ex.Message 
                });
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
    }
}
