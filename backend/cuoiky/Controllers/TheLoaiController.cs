using cuoiky.DTOs;
using cuoiky.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TheLoaiController : ControllerBase
    {
        private readonly QuanLySachContext _context;

        public TheLoaiController(QuanLySachContext context)
        {
            _context = context;
        }

        // ✅ Lấy tất cả thể loại

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var theLoais = await _context.TheLoais
                .Select(t => new
                {
                    t.Id,
                    t.TenTheLoai
                })
                .ToListAsync();

            return Ok(theLoais);
        }

        // ✅ Thêm thể loại mới
        [Authorize]
        [HttpPost("CreateTheLoai")]
        public async Task<IActionResult> Create([FromBody] TheLoaiDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.TenTheLoai))
                return BadRequest(new { statusCode = 400, message = "Tên thể loại không được để trống" });

            var theLoai = new TheLoai
            {
                TenTheLoai = dto.TenTheLoai
            };

            _context.TheLoais.Add(theLoai);
            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Thêm thể loại thành công" });
        }

        // ✅ Cập nhật thể loại
       

        // ✅ Xóa thể loại
     
    }
}
