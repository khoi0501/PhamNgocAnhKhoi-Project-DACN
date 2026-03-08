using cuoiky.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ThongtincanhanController : ControllerBase
    {
        private readonly QuanLySachContext _context;

        public ThongtincanhanController(QuanLySachContext context)
        {
            _context = context;
        }

        // POST api/Thongtincanhan/Thongtincanhan
        [Authorize]
        [HttpPost("Thongtincanhan")]
        public async Task<IActionResult> UpsertThongTinCaNhan([FromBody] ThongTinCaNhanDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { statusCode = 400, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            // Lấy email từ claims của tài khoản đã đăng nhập
            string? email = null;
            email = User?.FindFirstValue(ClaimTypes.Email)
                    ?? User?.FindFirst("email")?.Value
                    ?? User?.FindFirst("emails")?.Value
                    ?? User?.FindFirst("preferred_username")?.Value
                    ?? User?.FindFirst("sub")?.Value // in our login, sub = email
                    ?? User?.Identity?.Name;

            TaiKhoan? user = null;
            if (!string.IsNullOrWhiteSpace(email) && email!.Contains('@'))
            {
                user = await _context.TaiKhoans.FirstOrDefaultAsync(t => t.Email == email);
            }
            else
            {
                // Fallback: get numeric user id from custom claim TaiKhoanId
                var userIdClaim = User?.FindFirst("TaiKhoanId")?.Value
                                  ?? User?.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrWhiteSpace(userIdClaim) && long.TryParse(userIdClaim, out var userId))
                {
                    user = await _context.TaiKhoans.FirstOrDefaultAsync(t => t.Id == userId);
                }
            }

            if (user == null)
            {
                return Unauthorized(new { statusCode = 401, message = "Không xác định được tài khoản từ phiên đăng nhập. Vui lòng đảm bảo token chứa email hoặc user id." });
            }
            // user đã được xác định ở trên

            // Validate again at server side for strictness
            if (dto.SoDienThoai is null || dto.SoDienThoai.Length != 10 || !dto.SoDienThoai.All(char.IsDigit))
            {
                return BadRequest(new { statusCode = 400, message = "Số điện thoại phải gồm 10 chữ số" });
            }
            if (dto.SoCCCD is null || dto.SoCCCD.Length != 12 || !dto.SoCCCD.All(char.IsDigit))
            {
                return BadRequest(new { statusCode = 400, message = "Số CCCD phải gồm 12 chữ số" });
            }

            user.HovaTen = dto.HovaTen;
            user.SoDienThoai = dto.SoDienThoai;
            user.SoCccd = dto.SoCCCD;
            user.DiaChi = dto.DiaChi; // client should compose full address string including ward/city selections

            await _context.SaveChangesAsync();

            return Ok(new
            {
                statusCode = 200,
                message = "Cập nhật thông tin cá nhân thành công",
                data = new
                {
                    email = user.Email,
                    hovaTen = user.HovaTen,
                    soDienThoai = user.SoDienThoai,
                    soCCCD = user.SoCccd,
                    diaChi = user.DiaChi
                }
            });
        }
    }
}


