using cuoiky.DTOs;
using cuoiky.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TonKhoController : ControllerBase
    {
        private readonly QuanLySachContext _context;

        public TonKhoController(QuanLySachContext context)
        {
            _context = context;
        }

        // ✅ 1. Lấy danh sách tồn kho
        [Authorize]
        [HttpGet("LayDanhSach")]
        public async Task<IActionResult> LayDanhSach()
        {
            try
            {
                var danhSachTonKho = await _context.TonKhos
                    .Include("IdSachNavigation.IdTheLoaiNavigation")
                    .Select(tk => new
                    {
                        tk.Id,
                        tk.IdSach,
                        tk.SoLuong,
                        Sach = tk.IdSachNavigation != null ? new
                        {
                            tk.IdSachNavigation.TenSach,
                            tk.IdSachNavigation.HinhAnh,
                            tk.IdSachNavigation.TenTacGia,
                            tk.IdSachNavigation.TenNhaSanXuat,
                            tk.IdSachNavigation.NgaySanXuat,
                            TheLoai = tk.IdSachNavigation.IdTheLoaiNavigation != null
                                ? tk.IdSachNavigation.IdTheLoaiNavigation.TenTheLoai
                                : null
                        } : null
                    })
                    .ToListAsync();

                var result = danhSachTonKho.Select(tk => new TonKhoDTO
                {
                    Id = tk.Id,
                    IdSach = tk.IdSach,
                    TenSach = tk.Sach?.TenSach,
                    TenTheLoai = tk.Sach?.TheLoai,
                    HinhAnh = tk.Sach?.HinhAnh,
                    TenTacGia = tk.Sach?.TenTacGia,
                    TenNhaSanXuat = tk.Sach?.TenNhaSanXuat,
                    NgaySanXuat = tk.Sach?.NgaySanXuat,
                    SoLuong = tk.SoLuong
                }).ToList();

                return Ok(new { statusCode = 200, data = result });
            }
            catch (Exception ex)
            {
                return Ok(new { statusCode = 500, message = $"Lỗi khi lấy danh sách tồn kho: {ex.Message}" });
            }
        }

        // ✅ 2. Xuất kho (trừ số lượng tồn kho, cộng số lượng sách)
        [Authorize(Roles = "Admin")]
        [HttpPost("XuatKho")]
        public async Task<IActionResult> XuatKho([FromBody] XuatKhoDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Ok(new { statusCode = 400, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }

                // Validation
                if (dto.SoLuongXuat <= 0)
                {
                    return Ok(new { statusCode = 400, message = "Số lượng xuất phải lớn hơn 0" });
                }

                // Tìm tồn kho
                var tonKho = await _context.TonKhos
                    .Include(tk => tk.IdSachNavigation)
                    .FirstOrDefaultAsync(tk => tk.Id == dto.IdTonKho);

                if (tonKho == null)
                {
                    return Ok(new { statusCode = 404, message = "Không tìm thấy bản ghi tồn kho" });
                }

                // Kiểm tra số lượng tồn kho có đủ không
                var soLuongHienTai = tonKho.SoLuong ?? 0;
                if (soLuongHienTai < dto.SoLuongXuat)
                {
                    return Ok(new
                    {
                        statusCode = 400,
                        message = $"Số lượng tồn kho không đủ. Hiện tại: {soLuongHienTai}, yêu cầu xuất: {dto.SoLuongXuat}"
                    });
                }

                // Tìm sách tương ứng
                var idSach = tonKho.IdSach;
                if (idSach == null)
                {
                    return Ok(new { statusCode = 400, message = "Bản ghi tồn kho không có thông tin sách" });
                }

                var sach = await _context.Saches.FindAsync(idSach.Value);
                if (sach == null)
                {
                    return Ok(new { statusCode = 404, message = "Không tìm thấy sách tương ứng" });
                }

                // Sử dụng transaction để đảm bảo tính nhất quán
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Trừ số lượng tồn kho
                    tonKho.SoLuong = soLuongHienTai - dto.SoLuongXuat;

                    // Cộng số lượng vào sách
                    sach.SoLuong = (sach.SoLuong ?? 0) + dto.SoLuongXuat;

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Xuất kho thành công",
                        data = new
                        {
                            idTonKho = tonKho.Id,
                            tenSach = sach.TenSach,
                            soLuongXuat = dto.SoLuongXuat,
                            soLuongTonKhoConLai = tonKho.SoLuong,
                            soLuongSachHienTai = sach.SoLuong
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
                return Ok(new { statusCode = 500, message = $"Lỗi khi xuất kho: {ex.Message}" });
            }
        }
    }
}

