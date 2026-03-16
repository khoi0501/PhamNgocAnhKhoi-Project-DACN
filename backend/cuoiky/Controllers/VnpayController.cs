using cuoiky.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using cuoiky.Services.VnpayServices;
using VNPAY.NET;
using VNPAY.NET.Models;
using VNPAY.NET.Utilities;
using cuoiky.Services.VnpayServices.Enums;

namespace cuoiky.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VnpayController : ControllerBase
    {
        private readonly IVnpay _vnpay;
        private readonly IConfiguration _configuration;
        private readonly QuanLySachContext _context;

        public VnpayController(IVnpay vnPayservice, IConfiguration configuration,QuanLySachContext quanLySachContext)
        {
            _vnpay = vnPayservice;
            _configuration = configuration;
            _context = quanLySachContext;

            _vnpay.Initialize(_configuration["Vnpay:TmnCode"], _configuration["Vnpay:HashSecret"], _configuration["Vnpay:CallbackUrl"], _configuration["Vnpay:BaseUrl"]);
        }
        [HttpGet("CreatePaymentUrl")]
        public ActionResult<string> CreatePaymentUrl(double money, string description)
        {
            try
            {
                var ipAddress = NetworkHelper.GetIpAddress(HttpContext); // Lấy địa chỉ IP của thiết bị thực hiện giao dịch

                var request = new PaymentRequest
                {
                    PaymentId = DateTime.Now.Ticks,
                    Money = money,
                    Description = description,
                    IpAddress = ipAddress,
                    BankCode = BankCode.ANY, // Tùy chọn. Mặc định là tất cả phương thức giao dịch
                    CreatedDate = DateTime.Now, // Tùy chọn. Mặc định là thời điểm hiện tại
                    Currency = Currency.VND, // Tùy chọn. Mặc định là VND (Việt Nam đồng)
                    Language = DisplayLanguage.Vietnamese // Tùy chọn. Mặc định là tiếng Việt
                };

                var paymentUrl = _vnpay.GetPaymentUrl(request);

                return Created(paymentUrl, paymentUrl);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("IpnAction")]
        public IActionResult IpnAction()
        {
            if (Request.QueryString.HasValue)
            {
                try
                {
                    var paymentResult = _vnpay.GetPaymentResult(Request.Query);
                    var thanhToanCho = _context.LichSuThanhToans.Find(paymentResult.PaymentId);

                    // Tùy chỉnh nội dung (ví dụ: lấy mã đơn từ query nếu có)
                    var orderId = Request.Query["vnp_TxnRef"].FirstOrDefault() ?? "—";
                    var amount = Request.Query["vnp_Amount"].FirstOrDefault() ?? "—";


                    if (thanhToanCho == null)
                    {
                        return BadRequest(new { statusCode = 404, message = "Không tìm thấy giao dịch thanh toán!" });
                    }
                    thanhToanCho.IdPhuongThucThanhToan = 2;
                    thanhToanCho.TrangThaiId = 1;
                    _context.LichSuThanhToans.Update(thanhToanCho);
                    _context.SaveChanges();
                    string successHtml = @"
<!doctype html>
<html lang=""vi"">
<head>
  <meta charset=""utf-8"">
  <meta name=""viewport"" content=""width=device-width,initial-scale=1"">
  <title>Thanh toán thành công</title>
  <style>
    :root{ --bg:#f6fbf8; --card:#ffffff; --accent:#16a34a; --muted:#6b7280; --shadow: 0 8px 24px rgba(18, 63, 29, 0.08);}
    *{box-sizing:border-box}
    body{margin:0; font-family:Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:linear-gradient(180deg,#f0fff4 0%,var(--bg) 100%); color:#0f172a; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px;}
    .card{background:var(--card); width:100%; max-width:720px; border-radius:14px; padding:32px; box-shadow:var(--shadow); text-align:center;}
    .icon{width:96px; height:96px; margin:0 auto 18px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:linear-gradient(135deg, rgba(22,163,74,0.12), rgba(22,163,74,0.06));}
    .title{font-size:22px; font-weight:700; margin:6px 0;}
    .subtitle{color:var(--muted); margin:0 0 18px; font-size:14px;}
    .details{display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin:18px 0;}
    .chip{background:#f8faf8; border:1px solid #eef7ee; padding:10px 14px; border-radius:10px; font-size:14px; color:#0b3b18;}
    .cta{margin-top:22px;}
    .btn{display:inline-block; text-decoration:none; padding:12px 20px; border-radius:10px; font-weight:600; border: none; background:var(--accent); color:white; box-shadow: 0 6px 18px rgba(16, 123, 52, 0.12);}
    .mutebtn{display:inline-block; margin-left:12px; padding:10px 16px; border-radius:10px; background:transparent; border:1px solid #e6eef0; color:var(--muted); text-decoration:none;}
    footer{margin-top:28px; color:var(--muted); font-size:13px;}
    @media (max-width:480px){
      .card{padding:20px}
      .title{font-size:18px}
    }
  </style>
</head>
<body>
  <main class=""card"" role=""main"">
    <div class=""icon"" aria-hidden=""true"">
      <!-- SVG tick -->
      <svg width=""56"" height=""56"" viewBox=""0 0 24 24"" fill=""none"" xmlns=""http://www.w3.org/2000/svg"" aria-hidden=""true"">
        <circle cx=""12"" cy=""12"" r=""12"" fill=""#16a34a"" opacity=""0.12""/>
        <path d=""M7.5 12.5l2.5 2.5L16.5 9.5"" stroke=""#16a34a"" stroke-width=""1.6"" stroke-linecap=""round"" stroke-linejoin=""round""/>
      </svg>
    </div>

    <h1 class=""title"">Thanh toán thành công</h1>
    <p class=""subtitle"">Cảm ơn bạn — giao dịch đã được xử lý thành công.</p>

   
    <div class=""cta"">
      <a class=""btn"" href=""/"" role=""button"">Quay về trang chủ</a>
      
    </div>

    <footer>
      <p> Nếu cần hỗ trợ, vui lòng liên hệ bộ phận chăm sóc khách hàng.</p>
    </footer>
  </main>
</body>
</html>
";

                    return Content(successHtml, "text/html; charset=utf-8");


                }
                catch (Exception ex)
                {
                    // Trả trang lỗi đơn giản khi có exception
                    string errorHtml = $@"
<!doctype html>
<html lang=""vi"">
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1""><title>Lỗi</title></head>
<body style=""font-family:Arial,Helvetica,sans-serif;padding:24px;background:#fff7f7;color:#2b2b2b;"">
  <h2>Lỗi khi xử lý thanh toán</h2>
  <p>{System.Net.WebUtility.HtmlEncode(ex.Message)}</p>
</body>
</html>";
                    return Content(errorHtml, "text/html; charset=utf-8");
                }
            }

            return NotFound("Không tìm thấy thông tin thanh toán.");
        }
    }
}
