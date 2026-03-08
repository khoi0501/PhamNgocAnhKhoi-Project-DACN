

namespace cuoiky.DTOs
{
    public class LoginRequest
    {

        public string Email { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
    }
    public class LoginReponse
    {
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public bool? IsAdmin { get; set; }
    }

}
