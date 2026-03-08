using cuoiky.DTOs;
using cuoiky.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DanhGiaController : ControllerBase
    {
        private readonly QuanLySachContext _context;
        private const string TrangThaiDonHangDaGiao = "Đơn hàng đã giao";

        public DanhGiaController(QuanLySachContext context)
        {
            _context = context;
        }

        private async Task<TaiKhoan?> GetCurrentUserAsync()
        {
            // Ưu tiên lấy ID từ claim "TaiKhoanId" hoặc NameIdentifier
            var idClaim = User?.FindFirstValue("TaiKhoanId")
                         ?? User?.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? User?.FindFirstValue("sub"); // fallback cuối

            if (long.TryParse(idClaim, out var userId))
            {
                return await _context.TaiKhoans.FindAsync(userId);
            }

            // Fallback theo email nếu token chứa email
            var email = User?.FindFirstValue(ClaimTypes.Email)
                        ?? User?.FindFirstValue("sub");
            if (!string.IsNullOrWhiteSpace(email))
            {
                return await _context.TaiKhoans.FirstOrDefaultAsync(t => t.Email == email);
            }

            return null;
        }

        /// <summary>
        /// Tạo đánh giá mới cho sách đã mua khi đơn hàng ở trạng thái "Đơn hàng đã giao"
        /// </summary>
        [Authorize]
        [HttpPost("TaoDanhGia")]
        public async Task<IActionResult> TaoDanhGia([FromBody] CreateReviewDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return Ok(new
                {
                    statusCode = 400,
                    errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }
            var user = await GetCurrentUserAsync();
            if (user == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }
            // ✅ Kiểm tra sách tồn tại
            var sach = await _context.Saches.FindAsync(dto.IdSach);
            if (sach == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy sách để đánh giá" });
            }
            // ✅ Kiểm tra đơn hàng tồn tại và thuộc về user
            var donHang = await _context.DonHangs
                .Include(d => d.IdTrangThaiDonHangNavigation)
                .Include(d => d.ChiTietDonHangs)
                .FirstOrDefaultAsync(d => d.Id == dto.IdDonHang && d.IdTaiKhoan == user.Id);
            if (donHang == null)
            {
                return Ok(new
                {
                    statusCode = 404,
                    message = "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn"
                });
            }
            // ✅ Kiểm tra đơn hàng đã giao chưa
            if (donHang.IdTrangThaiDonHangNavigation?.TenTrangThai != TrangThaiDonHangDaGiao)
            {
                return Ok(new
                {
                    statusCode = 400,
                    message = "Bạn chỉ có thể đánh giá khi đơn hàng đã giao hoàn tất."
                });
            }
            // ✅ Kiểm tra sản phẩm có trong đơn hàng không
            var chiTiet = donHang.ChiTietDonHangs.FirstOrDefault(ct => ct.IdSach == dto.IdSach);
            if (chiTiet == null)
            {
                return Ok(new
                {
                    statusCode = 400,
                    message = "Sản phẩm này không có trong đơn hàng"
                });
            }
            // ✅ Kiểm tra đã đánh giá cho đơn hàng này chưa
            var daDanhGia = await _context.DanhGia
                .AnyAsync(dg => dg.IdTaiKhoan == user.Id
                             && dg.IdSach == dto.IdSach
                             && dg.IdDonHang == dto.IdDonHang);
            if (daDanhGia)
            {
                return Ok(new
                {
                    statusCode = 400,
                    message = "Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi."
                });
            }
            // ✅ Tạo đánh giá mới
            var danhGia = new DanhGium
            {
                IdTaiKhoan = user.Id,
                IdSach = dto.IdSach,
                IdDonHang = dto.IdDonHang, // ✅ LƯU IdDonHang
                SoSao = dto.SoSao,
                NoiDung = dto.NoiDung,
                NgayDanhGia = DateTime.Now
            };
            _context.DanhGia.Add(danhGia);
            await _context.SaveChangesAsync();
            var response = new DanhGiaChiTietDTO
            {
                Id = danhGia.Id,
                IdSach = dto.IdSach,
                IdDonHang = dto.IdDonHang, // ✅ TRẢ VỀ IdDonHang
                TenSach = sach.TenSach,
                TenTaiKhoan = user.HovaTen,
                Email = user.Email,
                SoSao = dto.SoSao,
                NoiDung = dto.NoiDung,
                NgayDanhGia = danhGia.NgayDanhGia,
                NgayDatSach = donHang.NgayDat
            };
            return Ok(new
            {
                statusCode = 200,
                message = "Đánh giá thành công",
                data = response
            });
        }

        /// <summary>
        /// Lấy danh sách đánh giá của chính người dùng (hiển thị tài khoản, ngày đặt, số sao, sách đã đặt, nội dung)
        /// </summary>
        [Authorize]
        [HttpGet("DanhGiaCuaToi")]
        public async Task<IActionResult> LayDanhGiaCuaToi()
        {
            var user = await GetCurrentUserAsync();
            if (user == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }
            var danhGia = await _context.DanhGia
                .Where(dg => dg.IdTaiKhoan == user.Id)
                .OrderByDescending(dg => dg.NgayDanhGia)
                .Select(dg => new DanhGiaChiTietDTO
                {
                    Id = dg.Id,
                    IdSach = dg.IdSach ?? 0,
                    IdDonHang = dg.IdDonHang, // ✅ TRẢ VỀ IdDonHang
                    TenSach = dg.IdSachNavigation != null ? dg.IdSachNavigation.TenSach : null,
                    TenTaiKhoan = user.HovaTen,
                    Email = user.Email,
                    SoSao = dg.SoSao,
                    NoiDung = dg.NoiDung,
                    NgayDanhGia = dg.NgayDanhGia,
                    NgayDatSach = dg.IdDonHangNavigation != null ? dg.IdDonHangNavigation.NgayDat : null
                })
                .ToListAsync();
            return Ok(new
            {
                statusCode = 200,
                data = danhGia
            });
        }

        [AllowAnonymous]
        [HttpGet("Sach/{idSach:int}")]
        public async Task<IActionResult> LayDanhGiaTheoSach(int idSach)
        {
            var danhGia = await _context.DanhGia
                .Where(dg => dg.IdSach == idSach)
                .OrderByDescending(dg => dg.NgayDanhGia)
                .Select(dg => new DanhGiaChiTietDTO
                {
                    Id = dg.Id,
                    IdSach = dg.IdSach ?? 0,
                    TenSach = dg.IdSachNavigation!.TenSach,
                    TenTaiKhoan = dg.IdTaiKhoanNavigation!.HovaTen,
                    Email = dg.IdTaiKhoanNavigation.Email,
                    SoSao = dg.SoSao,
                    NoiDung = dg.NoiDung,
                    NgayDanhGia = dg.NgayDanhGia,
                    NgayDatSach = _context.ChiTietDonHangs
                        .Where(ct => ct.IdSach == dg.IdSach && ct.IdDonHangNavigation!.IdTaiKhoan == dg.IdTaiKhoan)
                        .OrderByDescending(ct => ct.IdDonHangNavigation!.NgayDat)
                        .Select(ct => ct.IdDonHangNavigation!.NgayDat)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new { statusCode = 200, data = danhGia });
        }
    }
}
