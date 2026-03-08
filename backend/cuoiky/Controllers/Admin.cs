using cuoiky.DTOs;
using cuoiky.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly QuanLySachContext _context;

        public AdminController(QuanLySachContext context)
        {
            _context = context;
        }

        /// <summary>
        /// 🧑‍💻 Tạo tài khoản admin mới
        /// </summary>
        [Authorize]
        [HttpPost("TaoTaiKhoanAdmin")]
        public IActionResult TaoTaiKhoanAdmin([FromBody] RegisterDTO request)
        {
            // ✅ Kiểm tra quyền Admin từ token
            if (!User.IsInRole("Admin"))
            {
                return Unauthorized(new LoginReponse
                {
                    StatusCode = 401,
                    Message = "Bạn không có quyền tạo tài khoản Admin"
                });
            }

            // 1️⃣ Kiểm tra email hợp lệ
            if (string.IsNullOrEmpty(request.Email) ||
                !System.Text.RegularExpressions.Regex.IsMatch(request.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 400,
                    Message = "Email không hợp lệ"
                });
            }

            // 2️⃣ Kiểm tra email đã tồn tại chưa
            var existingUser = _context.TaiKhoans.FirstOrDefault(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 500,
                    Message = "Email đã tồn tại"
                });
            }

            // 3️⃣ Kiểm tra mật khẩu và xác nhận mật khẩu
            if (request.MatKhau != request.XacNhanMatKhau)
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 500,
                    Message = "Mật khẩu và xác nhận mật khẩu không khớp"
                });
            }

            // 4️⃣ Kiểm tra chức vụ có tồn tại không
            if (request.IdChucVu <= 0)
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 400,
                    Message = "Vui lòng chọn chức vụ"
                });
            }

            var chucVu = _context.ChucVus.FirstOrDefault(cv => cv.Id == request.IdChucVu);
            if (chucVu == null)
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 400,
                    Message = "Chức vụ không tồn tại"
                });
            }

            // 5️⃣ Kiểm tra các trường bắt buộc
            if (string.IsNullOrEmpty(request.HovaTen))
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 400,
                    Message = "Vui lòng nhập họ và tên"
                });
            }

            // 6️⃣ Tạo tài khoản admin/nhân viên mới
            var adminUser = new TaiKhoan
            {
                HovaTen = request.HovaTen,
                Email = request.Email,
                SoDienThoai = request.SoDienThoai ?? string.Empty,
                DiaChi = request.DiaChi ?? string.Empty,
                SoCccd = request.SoCCCD ?? string.Empty,  // ✅ Sửa: SoCCCD → SoCccd
                MatKhau = request.MatKhau,
                SoLanNhapSaiMatKhau = 0,
                ThoiGianKhoaMatKhau = null,
                IsAdmin = true, // 🔥 mặc định là admin
                IdChucVu = request.IdChucVu
            };

            _context.TaiKhoans.Add(adminUser);
            _context.SaveChanges(); // Lưu để lấy Id

            // 7️⃣ Phân quyền cho nhân viên (nếu có danh sách phân quyền)
            if (request.PhanQuyens != null && request.PhanQuyens.Any())
            {
                foreach (var phanQuyen in request.PhanQuyens)
                {
                    // Kiểm tra chức năng có tồn tại không
                    var chucNang = _context.ChucNangs.FirstOrDefault(cn => cn.Id == phanQuyen.IdChucNang);
                    if (chucNang == null)
                    {
                        continue; // Bỏ qua nếu chức năng không tồn tại
                    }

                    // Kiểm tra đã có quyền chưa (tránh trùng lặp)
                    var existingPermission = _context.PhanQuyenTaiKhoans  // ✅ Sửa: PhanQuyen_TaiKhoans → PhanQuyenTaiKhoans
                        .FirstOrDefault(pq => pq.IdTaiKhoan == adminUser.Id && pq.IdChucNang == phanQuyen.IdChucNang);

                    if (existingPermission == null)
                    {
                        var newPermission = new PhanQuyenTaiKhoan  // ✅ Sửa: PhanQuyen_TaiKhoan → PhanQuyenTaiKhoan
                        {
                            IdTaiKhoan = (int)adminUser.Id,  // ✅ Cast vì Id là long
                            IdChucNang = phanQuyen.IdChucNang,
                            QuyenXem = phanQuyen.Quyen_Xem,
                            QuyenThem = phanQuyen.Quyen_Them,
                            QuyenSua = phanQuyen.Quyen_Sua,
                            QuyenXoa = phanQuyen.Quyen_Xoa
                        };

                        _context.PhanQuyenTaiKhoans.Add(newPermission);  // ✅ Sửa: PhanQuyen_TaiKhoans → PhanQuyenTaiKhoans
                    }
                }

                _context.SaveChanges();
            }

            return Ok(new LoginReponse
            {
                StatusCode = 200,
                Message = "✅ Tạo tài khoản  thành công"
            });
        }

        /// <summary>
        /// 📋 Lấy danh sách tất cả tài khoản admin (isAdmin = true)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("LayDanhSachAdmin")]
        public async Task<IActionResult> LayDanhSachAdmin()
        {
            try
            {
                var danhSachAdmin = await _context.TaiKhoans
                    .Where(tk => tk.IsAdmin == true)
                    .Select(tk => new AdminDTO
                    {
                        Id = tk.Id,
                        Email = tk.Email,
                        MatKhau = tk.MatKhau,
                        HovaTen = tk.HovaTen,
                        SoDienThoai = tk.SoDienThoai,
                        DiaChi = tk.DiaChi,
                        SoCCCD = tk.SoCccd
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Lấy danh sách admin thành công",
                    data = danhSachAdmin
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    statusCode = 500,
                    message = $"Lỗi khi lấy danh sách admin: {ex.Message}"
                });
            }
        }

        // ✅ Thêm 2 API mới này vào cùng controller

        [Authorize(Roles = "Admin")]
        [HttpGet("LayDanhSachChucVu")]
        public async Task<IActionResult> LayDanhSachChucVu()
        {
            try
            {
                var danhSachChucVu = await _context.ChucVus
                    .Select(cv => new
                    {
                        Id = cv.Id,
                        TenChucVu = cv.TenChucVu
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Lấy danh sách chức vụ thành công",
                    data = danhSachChucVu
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    statusCode = 500,
                    message = $"Lỗi khi lấy danh sách chức vụ: {ex.Message}"
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("LayDanhSachChucNang")]
        public async Task<IActionResult> LayDanhSachChucNang()
        {
            try
            {
                var danhSachChucNang = await _context.ChucNangs
                    .Select(cn => new
                    {
                        Id = cn.Id,
                        MaChucNang = cn.MaChucNang,
                        TenChucNang = cn.TenChucNang,
                        MoTa = cn.MoTa
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Lấy danh sách chức năng thành công",
                    data = danhSachChucNang
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    statusCode = 500,
                    message = $"Lỗi khi lấy danh sách chức năng: {ex.Message}"
                });
            }
        }
        [Authorize(Roles = "Admin")]
        [HttpGet("LayPhanQuyenCuaToi")]
        public async Task<IActionResult> LayPhanQuyenCuaToi()
        {
            try
            {
                // Lấy IdTaiKhoan từ token
                var taiKhoanIdClaim = User.FindFirst("TaiKhoanId")?.Value;
                if (string.IsNullOrEmpty(taiKhoanIdClaim))
                {
                    return Ok(new
                    {
                        statusCode = 401,
                        message = "Không tìm thấy thông tin tài khoản"
                    });
                }

                if (!long.TryParse(taiKhoanIdClaim, out long taiKhoanId))
                {
                    return Ok(new
                    {
                        statusCode = 400,
                        message = "Id tài khoản không hợp lệ"
                    });
                }

                // ✅ SỬA: Luôn lấy quyền từ bảng PhanQuyen_TaiKhoan trước
                var phanQuyens = await _context.PhanQuyenTaiKhoans
                    .Where(pq => pq.IdTaiKhoan == (int)taiKhoanId)
                    .Select(pq => new
                    {
                        idChucNang = pq.IdChucNang,
                        quyenXem = pq.QuyenXem,
                        quyenThem = pq.QuyenThem,
                        quyenSua = pq.QuyenSua,
                        quyenXoa = pq.QuyenXoa
                    })
                    .ToListAsync();

                // ✅ SỬA: Nếu có quyền trong bảng, trả về quyền đó (ngay cả khi IsAdmin = true)
                if (phanQuyens.Any())
                {
                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Lấy danh sách quyền thành công",
                        data = phanQuyens
                    });
                }

                // ✅ SỬA: Chỉ khi KHÔNG có quyền trong bảng, mới kiểm tra IsAdmin
                var taiKhoan = await _context.TaiKhoans.FirstOrDefaultAsync(tk => tk.Id == taiKhoanId);
                if (taiKhoan == null)
                {
                    return Ok(new
                    {
                        statusCode = 404,
                        message = "Không tìm thấy tài khoản"
                    });
                }

                // Nếu là admin và không có quyền trong bảng → Full quyền (trả về rỗng)
                if (taiKhoan.IsAdmin == true)
                {
                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Admin có full quyền (không có quyền trong bảng)",
                        data = new List<object>() // Trả về rỗng để frontend biết là admin
                    });
                }

                // Nếu không phải admin và không có quyền → Không có quyền gì
                return Ok(new
                {
                    statusCode = 200,
                    message = "Không có quyền nào",
                    data = new List<object>() // Trả về rỗng
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    statusCode = 500,
                    message = $"Lỗi khi lấy danh sách quyền: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// ✏️ Sửa thông tin tài khoản admin
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("SuaAdmin/{id}")]
        public async Task<IActionResult> SuaAdmin(long id, [FromBody] UpdateAdminDTO dto)
        {
            try
            {
                var admin = await _context.TaiKhoans.FindAsync(id);
                if (admin == null)
                {
                    return Ok(new
                    {
                        statusCode = 404,
                        message = "Không tìm thấy tài khoản admin"
                    });
                }

                // Kiểm tra phải là admin
                if (admin.IsAdmin != true)
                {
                    return Ok(new
                    {
                        statusCode = 400,
                        message = "Tài khoản này không phải là admin"
                    });
                }

                // Kiểm tra email mới có trùng với email khác không (nếu có thay đổi email)
                if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != admin.Email)
                {
                    var emailDaTonTai = await _context.TaiKhoans
                        .AnyAsync(tk => tk.Email == dto.Email && tk.Id != id);
                    if (emailDaTonTai)
                    {
                        return Ok(new
                        {
                            statusCode = 400,
                            message = "Email này đã được sử dụng bởi tài khoản khác"
                        });
                    }

                    // Kiểm tra email hợp lệ
                    if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                    {
                        return Ok(new
                        {
                            statusCode = 400,
                            message = "Email không hợp lệ"
                        });
                    }
                }

                // Cập nhật thông tin
                if (!string.IsNullOrWhiteSpace(dto.Email)) admin.Email = dto.Email;
                if (!string.IsNullOrWhiteSpace(dto.MatKhau)) admin.MatKhau = dto.MatKhau;
                if (dto.HovaTen != null) admin.HovaTen = dto.HovaTen;
                if (dto.SoDienThoai != null) admin.SoDienThoai = dto.SoDienThoai;
                if (dto.DiaChi != null) admin.DiaChi = dto.DiaChi;
                if (dto.SoCCCD != null) admin.SoCccd = dto.SoCCCD;

                // Cập nhật chức vụ (nếu có)
                if (dto.IdChucVu.HasValue)
                {
                    var chucVu = await _context.ChucVus.FirstOrDefaultAsync(cv => cv.Id == dto.IdChucVu.Value);
                    if (chucVu == null)
                    {
                        return Ok(new
                        {
                            statusCode = 400,
                            message = "Chức vụ không tồn tại"
                        });
                    }
                    admin.IdChucVu = dto.IdChucVu.Value;
                }

                // Thêm/Sửa quyền
                if (dto.PhanQuyens != null && dto.PhanQuyens.Any())
                {
                    foreach (var pq in dto.PhanQuyens)
                    {
                        var existingPermission = await _context.PhanQuyenTaiKhoans
                            .FirstOrDefaultAsync(x => x.IdTaiKhoan == (int)admin.Id && x.IdChucNang == pq.IdChucNang);

                        if (existingPermission == null)
                        {
                            var newPermission = new PhanQuyenTaiKhoan
                            {
                                IdTaiKhoan = (int)admin.Id,
                                IdChucNang = pq.IdChucNang,
                                QuyenXem = pq.QuyenXem ?? false,
                                QuyenThem = pq.QuyenThem ?? false,
                                QuyenSua = pq.QuyenSua ?? false,
                                QuyenXoa = pq.QuyenXoa ?? false
                            };
                            _context.PhanQuyenTaiKhoans.Add(newPermission);
                        }
                        else
                        {
                            if (pq.QuyenXem.HasValue) existingPermission.QuyenXem = pq.QuyenXem.Value;
                            if (pq.QuyenThem.HasValue) existingPermission.QuyenThem = pq.QuyenThem.Value;
                            if (pq.QuyenSua.HasValue) existingPermission.QuyenSua = pq.QuyenSua.Value;
                            if (pq.QuyenXoa.HasValue) existingPermission.QuyenXoa = pq.QuyenXoa.Value;
                        }
                    }
                }

                // Xóa quyền
                if (dto.XoaPhanQuyens != null && dto.XoaPhanQuyens.Any())
                {
                    foreach (var idChucNang in dto.XoaPhanQuyens)
                    {
                        var existingPermission = await _context.PhanQuyenTaiKhoans
                            .FirstOrDefaultAsync(x => x.IdTaiKhoan == (int)admin.Id && x.IdChucNang == idChucNang);
                        if (existingPermission != null)
                        {
                            _context.PhanQuyenTaiKhoans.Remove(existingPermission);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                var response = new AdminDTO
                {
                    Id = admin.Id,
                    Email = admin.Email,
                    MatKhau = admin.MatKhau,
                    HovaTen = admin.HovaTen,
                    SoDienThoai = admin.SoDienThoai,
                    DiaChi = admin.DiaChi,
                    SoCCCD = admin.SoCccd,
                    IdChucVu = admin.IdChucVu
                };

                return Ok(new
                {
                    statusCode = 200,
                    message = "Sửa thông tin admin thành công",
                    data = response
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    statusCode = 500,
                    message = $"Lỗi khi sửa admin: {ex.Message}"
                });
            }
        }
        [Authorize(Roles = "Admin")]
        [HttpGet("LayChiTietAdmin/{id}")]
        public async Task<IActionResult> LayChiTietAdmin(long id)
        {
            try
            {
                var admin = await _context.TaiKhoans
                    .Where(tk => tk.Id == id && tk.IsAdmin == true)
                    .Select(tk => new
                    {
                        Id = tk.Id,
                        Email = tk.Email,
                        HovaTen = tk.HovaTen,
                        SoDienThoai = tk.SoDienThoai,
                        DiaChi = tk.DiaChi,
                        SoCCCD = tk.SoCccd,
                        IdChucVu = tk.IdChucVu,
                        TenChucVu = tk.IdChucVu.HasValue
                            ? _context.ChucVus
                                .Where(cv => cv.Id == tk.IdChucVu.Value)
                                .Select(cv => cv.TenChucVu)
                                .FirstOrDefault()
                            : null,
                        PhanQuyens = _context.PhanQuyenTaiKhoans
                            .Where(pq => pq.IdTaiKhoan == tk.Id)
                            .Select(pq => new
                            {
                                IdChucNang = pq.IdChucNang,
                                QuyenXem = pq.QuyenXem,
                                QuyenThem = pq.QuyenThem,
                                QuyenSua = pq.QuyenSua,
                                QuyenXoa = pq.QuyenXoa
                            })
                            .ToList()
                    })
                    .FirstOrDefaultAsync();

                if (admin == null)
                {
                    return Ok(new
                    {
                        statusCode = 404,
                        message = "Không tìm thấy tài khoản admin"
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Lấy chi tiết admin thành công",
                    data = admin
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    statusCode = 500,
                    message = $"Lỗi khi lấy chi tiết admin: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// 🗑️ Xóa tài khoản admin
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("XoaAdmin/{id}")]
        public async Task<IActionResult> XoaAdmin(long id)
        {
            try
            {
                var admin = await _context.TaiKhoans.FindAsync(id);
                if (admin == null)
                {
                    return Ok(new
                    {
                        statusCode = 404,
                        message = "Không tìm thấy tài khoản admin"
                    });
                }

                // Kiểm tra phải là admin
                if (admin.IsAdmin != true)
                {
                    return Ok(new
                    {
                        statusCode = 400,
                        message = "Tài khoản này không phải là admin"
                    });
                }

                // Đếm số lượng admin còn lại
                var soLuongAdminConLai = await _context.TaiKhoans
                    .CountAsync(tk => tk.IsAdmin == true && tk.Id != id);

                // Không cho phép xóa nếu chỉ còn 1 admin
                if (soLuongAdminConLai == 0)
                {
                    return Ok(new
                    {
                        statusCode = 400,
                        message = "Không thể xóa admin cuối cùng trong hệ thống"
                    });
                }

                // ✅ Xóa tất cả phân quyền của tài khoản trước
                var phanQuyens = await _context.PhanQuyenTaiKhoans
                    .Where(pq => pq.IdTaiKhoan == (int)id)
                    .ToListAsync();

                if (phanQuyens.Any())
                {
                    _context.PhanQuyenTaiKhoans.RemoveRange(phanQuyens);
                    await _context.SaveChangesAsync();
                }

                // ✅ Sau đó mới xóa tài khoản admin
                _context.TaiKhoans.Remove(admin);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Xóa tài khoản admin thành công"
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    statusCode = 500,
                    message = $"Lỗi khi xóa admin: {ex.Message}"
                });
            }
        }
    }
}
