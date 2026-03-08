using cuoiky.DTOs;
using cuoiky.Models; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class XacThucTaiKhoanController : ControllerBase
    {
        private readonly QuanLySachContext _context;
        private readonly IConfiguration _config;
        private readonly EmailSettings _emailSettings;

        public XacThucTaiKhoanController(QuanLySachContext context, IConfiguration config, EmailSettings emailSettings)
        {
            _context = context;
            _config = config;
            _emailSettings = emailSettings;
        }


        [HttpPost("DangNhap")]
        public IActionResult DangNhap([FromBody] LoginRequest request)
        {
            var user = _context.TaiKhoans.FirstOrDefault(u => u.Email == request.Email);

            if (user == null)
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 500,
                    Message = "Tài khoản không tồn tại"
                });
            }

            // kiểm tra xem có đang bị khóa không
            if (user.ThoiGianKhoaMatKhau != null && user.ThoiGianKhoaMatKhau > DateTime.Now)
            {
                var conLai = user.ThoiGianKhoaMatKhau.Value - DateTime.Now;
                return Ok(new LoginReponse
                {
                    StatusCode = 403,
                    Message = $"Tài khoản bị khóa, vui lòng thử lại sau {conLai.Minutes} phút {conLai.Seconds} giây"
                });
            }

            // kiểm tra mật khẩu
            if (user.MatKhau == request.MatKhau)
            {
                user.SoLanNhapSaiMatKhau = 0;
                user.ThoiGianKhoaMatKhau = null;
                _context.SaveChanges();

                // ✅ Sinh JWT token
                var claims = new[]
                {
            new Claim(JwtRegisteredClaimNames.Sub, user.Email),
            new Claim("TaiKhoanId", user.Id.ToString()),
            // Sử dụng toán tử ?? false để xử lý trường hợp user.IsAdmin là null
            new Claim(ClaimTypes.Role, (user.IsAdmin ?? false) ? "Admin" : "User")
        };

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? throw new Exception("Jwt:Key không được null")));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: _config["Jwt:Issuer"],
                    audience: _config["Jwt:Audience"],
                    claims: claims,
                    expires: DateTime.Now.AddHours(1),
                    signingCredentials: creds
                );

                var jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

                return Ok(new LoginReponse
                {
                    StatusCode = 200,
                    Message = "Đăng nhập thành công",
                    Token = jwtToken,
                    // 🔑 ĐÃ SỬA: Sử dụng ?? false để chuyển đổi bool? sang bool
                    IsAdmin = user.IsAdmin ?? false
                });
            }
            else
            {
                user.SoLanNhapSaiMatKhau++;

                if (user.SoLanNhapSaiMatKhau >= 3)
                {
                    user.ThoiGianKhoaMatKhau = DateTime.Now.AddMinutes(5);
                    _context.SaveChanges();

                    return Ok(new LoginReponse
                    {
                        StatusCode = 403,
                        Message = "Sai Email hoặc Mật khẩu quá 3 lần. Tài khoản bị khóa 5 phút!"
                    });
                }
                else
                {
                    _context.SaveChanges();
                    return Ok(new LoginReponse
                    {
                        StatusCode = 500,
                        Message = $"Email hoặc mật khẩu không chính xác. Bạn còn {3 - user.SoLanNhapSaiMatKhau} lần thử."
                    });
                }
            }
        }

        [HttpPost("DangKy")]
        public IActionResult DangKy([FromBody] RegisterDTO request)
        {
            // ✅ Kiểm tra định dạng email
            if (string.IsNullOrEmpty(request.Email) ||
                !System.Text.RegularExpressions.Regex.IsMatch(request.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$") ||
                !(request.Email.Contains(".com") || request.Email.Contains(".com.vn") || request.Email.Contains(".vn")))
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 400,
                    Message = "Email không hợp lệ! Email phải có dạng như: ten@gmail.com hoặc ten@gmail.com.vn"
                });
            }

            // ✅ Kiểm tra email đã tồn tại chưa
            var existingUser = _context.TaiKhoans.FirstOrDefault(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 500,
                    Message = "Email đã tồn tại, vui lòng chọn email khác"
                });
            }

            // ✅ Kiểm tra mật khẩu và xác nhận mật khẩu
            if (request.MatKhau != request.XacNhanMatKhau)
            {
                return Ok(new LoginReponse
                {
                    StatusCode = 500,
                    Message = "Mật khẩu và xác nhận mật khẩu không trùng nhau"
                });
            }

            // ✅ Tạo tài khoản mới
            var newUser = new TaiKhoan
            {
                Email = request.Email,
                MatKhau = request.MatKhau,
                SoLanNhapSaiMatKhau = 0,
                ThoiGianKhoaMatKhau = null,
                // 🔑 BƯỚC THÊM QUAN TRỌNG: Đặt IsAdmin luôn là FALSE cho tài khoản đăng ký thường
                IsAdmin = false
            };

            _context.TaiKhoans.Add(newUser);
            _context.SaveChanges();

            // ✅ Tạo giỏ hàng cho tài khoản mới
            var gioHang = new GioHang
            {
                IdTaiKhoan = newUser.Id
            };
            _context.GioHangs.Add(gioHang);
            _context.SaveChanges();

            return Ok(new LoginReponse
            {
                StatusCode = 200,
                Message = "Đăng ký thành công"
            });
        }
        [HttpPost("gui-ma-otp")]
        public async Task<IActionResult> GuiMaOtp([FromBody] GuiOtpModel model)
        {
            var taiKhoan = await _context.TaiKhoans.FirstOrDefaultAsync(t => t.Email == model.Email);
            if (taiKhoan == null)
                return Ok(new { statusCode = 404, message = "Email không tồn tại" });

            var otp = TaoMaXacThuc(6); // tạo mã OTP 6 ký tự
            taiKhoan.EmailCode = otp;
            await _context.SaveChangesAsync();

            // Gửi email OTP dùng EmailSettings
            var smtpClient = new SmtpClient(_emailSettings.SmtpServer)
            {
                Port = _emailSettings.SmtpPort,
                Credentials = new NetworkCredential(_emailSettings.SenderEmail, _emailSettings.SenderPassword),
                UseDefaultCredentials = false,
                EnableSsl = true
            };
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailSettings.SenderEmail),
                Subject = "Mã OTP xác thực",
                Body = $"Mã OTP của bạn là: {otp} (hết hạn sau 5 phút)",
                IsBodyHtml = false
            };
            mailMessage.To.Add(taiKhoan.Email);
            await smtpClient.SendMailAsync(mailMessage);

            // Lưu email đã gửi OTP vào session
            HttpContext.Session.SetString("EmailDangXacThuc", taiKhoan.Email);

            return Ok(new { statusCode = 200, message = "OTP đã được gửi tới email" });
        }

        // ------------------- 2. Xác thực OTP -------------------
        [HttpPost("xac-thuc-ma")]
        public async Task<IActionResult> XacThucMa([FromBody] XacThucEmailModel model)
        {
            var email = HttpContext.Session.GetString("EmailDangXacThuc");
            if (string.IsNullOrEmpty(email))
                return Ok(new { statusCode = 401, message = "Phiên xác thực đã hết hạn. Vui lòng gửi lại OTP" });

            var taiKhoan = await _context.TaiKhoans.FirstOrDefaultAsync(t => t.Email == email && t.EmailCode == model.MaXacThuc);
            if (taiKhoan == null)
                return Ok(new { statusCode = 400, message = "Mã xác thực không hợp lệ" });

            // OTP hợp lệ, xóa khỏi database để tránh dùng lại
            taiKhoan.EmailCode = null;
            await _context.SaveChangesAsync();

            return Ok(new { statusCode = 200, message = "Xác thực thành công" });
        }

        // ------------------- 3. Đổi mật khẩu -------------------
        [HttpPost("dat-lai-mat-khau")]
        public async Task<IActionResult> DatLaiMatKhau([FromBody] DoiMatKhauModel model)
        {
            if (string.IsNullOrWhiteSpace(model.MatKhauMoi) || string.IsNullOrWhiteSpace(model.XacNhanMatKhauMoi))
                return Ok(new { statusCode = 400, message = "Mật khẩu mới và xác nhận không được để trống" });

            if (model.MatKhauMoi != model.XacNhanMatKhauMoi)
                return Ok(new { statusCode = 400, message = "Mật khẩu mới và xác nhận mật khẩu không trùng khớp" });

            var email = HttpContext.Session.GetString("EmailDangXacThuc");
            if (string.IsNullOrEmpty(email))
                return Ok(new { statusCode = 401, message = "Phiên xác thực đã hết hạn. Vui lòng xác thực lại" });

            var taiKhoan = await _context.TaiKhoans.FirstOrDefaultAsync(t => t.Email == email);
            if (taiKhoan == null)
                return Ok(new { statusCode = 404, message = "Không tìm thấy tài khoản từ email đã xác thực" });

            // Lưu mật khẩu mới (hash trước khi lưu)
            taiKhoan.MatKhau = (model.MatKhauMoi);
            await _context.SaveChangesAsync();

            HttpContext.Session.Remove("EmailDangXacThuc");

            return Ok(new { statusCode = 200, message = "Mật khẩu đã được thay đổi thành công" });
        }

        // ------------------- Hàm tạo OTP -------------------
        private string TaoMaXacThuc(int length = 6)
        {
            var random = new Random();
            const string chars = "0123456789";
            return new string(Enumerable.Repeat(chars, length).Select(s => s[random.Next(s.Length)]).ToArray());
        }

    }
}