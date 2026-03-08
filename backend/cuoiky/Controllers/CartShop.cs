using cuoiky.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CartShopController : ControllerBase
    {
        private readonly QuanLySachContext _context;

        public CartShopController(QuanLySachContext context)
        {
            _context = context;
        }

        // ✅ 1. Thêm sản phẩm vào giỏ hàng
        [HttpPost("ThemSanPham")]
        public async Task<IActionResult> ThemSanPham([FromBody] AddToCartDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { statusCode = 400, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            // Lấy thông tin user từ token
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }

            // Kiểm tra sách có tồn tại không
            var sach = await _context.Saches.FindAsync(dto.IdSach);
            if (sach == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy sách" });
            }

            // Kiểm tra số lượng tồn kho
            if (sach.SoLuong < dto.SoLuong)
            {
                return BadRequest(new { statusCode = 400, message = $"Số lượng tồn kho không đủ. Chỉ còn {sach.SoLuong} sản phẩm" });
            }

            // Lấy giỏ hàng của user
            var gioHang = await _context.GioHangs.FirstOrDefaultAsync(g => g.IdTaiKhoan == userId);
            if (gioHang == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy giỏ hàng" });
            }

            // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
            var chiTietGioHang = await _context.ChiTietGioHangs
                .FirstOrDefaultAsync(c => c.IdGioHang == gioHang.Id && c.IdSach == dto.IdSach);

            if (chiTietGioHang != null)
            {
                // Cập nhật số lượng
                chiTietGioHang.SoLuong += dto.SoLuong;
            }
            else
            {
                // Thêm mới vào giỏ hàng
                chiTietGioHang = new ChiTietGioHang
                {
                    IdGioHang = gioHang.Id,
                    IdSach = dto.IdSach,
                    SoLuong = dto.SoLuong,
                    HinhAnh = sach.HinhAnh,
                    Gia = sach.Gia
                };
                _context.ChiTietGioHangs.Add(chiTietGioHang);
            }

            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Thêm sản phẩm vào giỏ hàng thành công" });
        }

        // ✅ 2. Hiển thị sản phẩm trong giỏ hàng
        [HttpGet("HienThiGioHang")]
        public async Task<IActionResult> HienThiGioHang()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }

            var gioHang = await _context.GioHangs.FirstOrDefaultAsync(g => g.IdTaiKhoan == userId);
            if (gioHang == null)
            {
                return Ok(new { statusCode = 200, data = new CartResponseDTO() });
            }

            var chiTietGioHang = await _context.ChiTietGioHangs
                .Where(c => c.IdGioHang == gioHang.Id)
                .Include(c => c.IdSachNavigation)
                .Select(c => new CartItemDTO
                {
                    Id = c.Id,
                    IdSach = c.IdSach ?? 0,
                    TenSach = c.IdSachNavigation!.TenSach,
                    HinhAnh = c.HinhAnh, // Sử dụng HinhAnh từ ChiTietGioHang
                    Gia = c.Gia, // Sử dụng Gia từ ChiTietGioHang
                    SoLuong = c.SoLuong
                })
                .ToListAsync();

            var response = new CartResponseDTO
            {
                Items = chiTietGioHang
            };

            return Ok(new { statusCode = 200, data = response });
        }

        // ✅ 3. Sửa số lượng sản phẩm trong giỏ hàng
        [HttpPut("SuaSoLuong/{id}")]
        public async Task<IActionResult> SuaSoLuong(long id, [FromBody] UpdateCartItemDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { statusCode = 400, message = "Dữ liệu không hợp lệ", errors = ModelState });
            }

            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }

            var gioHang = await _context.GioHangs.FirstOrDefaultAsync(g => g.IdTaiKhoan == userId);
            if (gioHang == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy giỏ hàng" });
            }

            var chiTietGioHang = await _context.ChiTietGioHangs
                .FirstOrDefaultAsync(c => c.Id == id && c.IdGioHang == gioHang.Id);

            if (chiTietGioHang == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy sản phẩm trong giỏ hàng" });
            }

            // Kiểm tra số lượng tồn kho
            var sach = await _context.Saches.FindAsync(chiTietGioHang.IdSach);
            if (sach != null && sach.SoLuong < dto.SoLuong)
            {
                return BadRequest(new { statusCode = 400, message = $"Số lượng tồn kho không đủ. Chỉ còn {sach.SoLuong} sản phẩm" });
            }

            chiTietGioHang.SoLuong = dto.SoLuong;
            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Cập nhật số lượng thành công" });
        }

        // ✅ 4. Xóa sản phẩm khỏi giỏ hàng
        [HttpDelete("XoaSanPham/{id}")]
        public async Task<IActionResult> XoaSanPham(long id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản" });
            }

            var gioHang = await _context.GioHangs.FirstOrDefaultAsync(g => g.IdTaiKhoan == userId);
            if (gioHang == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy giỏ hàng" });
            }

            var chiTietGioHang = await _context.ChiTietGioHangs
                .FirstOrDefaultAsync(c => c.Id == id && c.IdGioHang == gioHang.Id);

            if (chiTietGioHang == null)
            {
                return NotFound(new { statusCode = 404, message = "Không tìm thấy sản phẩm trong giỏ hàng" });
            }

            _context.ChiTietGioHangs.Remove(chiTietGioHang);
            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Xóa sản phẩm khỏi giỏ hàng thành công" });
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



