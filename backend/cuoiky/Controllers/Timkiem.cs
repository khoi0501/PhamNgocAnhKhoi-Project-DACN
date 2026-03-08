using cuoiky.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TimkiemController : ControllerBase
    {
        private readonly QuanLySachContext _context;

        public TimkiemController(QuanLySachContext context)
        {
            _context = context;
        }

        // ✅ API tìm kiếm sách
        [HttpGet("TimKiemSach")]
        public async Task<IActionResult> TimKiemSach([FromQuery] string? keyword, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                // Kiểm tra keyword
                if (string.IsNullOrWhiteSpace(keyword) || keyword.Length < 2)
                {
                    return Ok(new
                    {
                        statusCode = 400,
                        message = "Từ khóa tìm kiếm phải có ít nhất 2 ký tự",
                        data = new List<object>()
                    });
                }

                // Validation pageSize
                if (pageSize <= 0 || pageSize > 50)
                {
                    pageSize = 10; // Default
                }

                // Chuẩn hóa keyword (loại bỏ khoảng trắng thừa, chuyển về chữ thường)
                var normalizedKeyword = keyword.Trim().ToLower();

                // Query tìm kiếm sách - SỬA LỖI LOGIC WHERE
                var query = _context.Saches
                    .Where(s => s.SoLuong > 0) // Chỉ hiển thị sách còn hàng
                    .Where(s => (s.TenSach != null && s.TenSach.ToLower().Contains(normalizedKeyword)) ||
                               (s.TenTacGia != null && s.TenTacGia.ToLower().Contains(normalizedKeyword)) ||
                               (s.MoTa != null && s.MoTa.ToLower().Contains(normalizedKeyword)))
                    .OrderByDescending(s => s.LuotXem) // Sắp xếp theo lượt xem
                    .ThenBy(s => s.TenSach);

                // Tính tổng số kết quả
                var totalCount = await query.CountAsync();

                // Phân trang - ✅ THÊM CÁC TRƯỜNG THIẾU
                var saches = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => new SearchResultDTO
                    {
                        Id = s.Id,
                        TenSach = s.TenSach ?? "",
                        TacGia = s.TenTacGia ?? "",
                        Gia = s.Gia ?? 0,
                        HinhAnh = s.HinhAnh ?? "",
                        SoLuong = s.SoLuong ?? 0,
                        LuotXem = s.LuotXem ?? 0,
                        MoTa = s.MoTa ?? "",
                      

                        // ✅ THÊM CÁC TRƯỜNG THIẾU
                        TenNhaSanXuat = s.TenNhaSanXuat ?? "",
                        NgaySanXuat = s.NgaySanXuat,
                        IdTheLoai = s.IdTheLoai ?? 0
                    })
                    .ToListAsync();

                // Tính thông tin phân trang
                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
                var hasNextPage = page < totalPages;
                var hasPreviousPage = page > 1;

                return Ok(new
                {
                    statusCode = 200,
                    message = $"Tìm thấy {totalCount} kết quả cho từ khóa '{normalizedKeyword}'",
                    data = new
                    {
                        results = saches,
                        pagination = new
                        {
                            currentPage = page,
                            pageSize = pageSize,
                            totalCount = totalCount,
                            totalPages = totalPages,
                            hasNextPage = hasNextPage,
                            hasPreviousPage = hasPreviousPage
                        },
                        keyword = normalizedKeyword
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = $"Lỗi server khi tìm kiếm: {ex.Message}",
                    data = new List<object>()
                });
            }
        }


    }
}









