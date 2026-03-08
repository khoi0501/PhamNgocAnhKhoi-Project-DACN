using cuoiky.Controllers;
using cuoiky.DTOs;
using cuoiky.Models;
using cuoiky.Services.VnpayServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using VNPAY.NET;

namespace cuoiky
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);/////

            // ✅ Đọc cấu hình từ appsettings.json
            builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

            // ✅ Cấu hình DbContext
            builder.Services.AddDbContext<QuanLySachContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("Connection")));
            builder.Services.AddSingleton<IVnpay, Vnpay>();
            builder.Services.AddSignalR();
            // ✅ Thêm Authentication với JWT
            var key = builder.Configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(key))
                throw new Exception("Jwt:Key không được null");

            builder.Services.AddAuthentication("Bearer")
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
                    };
                });

            // ✅ Thêm Swagger + cấu hình hiển thị ổ khoá Authorize
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "API - QuanLySach",
                    Version = "v1",
                    Description = "API Quản lý sách có xác thực JWT"
                });

                // 🛡️ Security Definition
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "Nhập JWT token theo định dạng: Bearer {token}",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                // 🧩 Security Requirement
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            // ✅ Cấu hình CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                     policy =>
                     {
                         policy.AllowAnyOrigin()
                               .AllowAnyMethod()
                               .AllowAnyHeader();
                     });
            });
            builder.Services.AddDistributedMemoryCache();
            builder.Services.AddSession(options =>
            {
                options.IdleTimeout = TimeSpan.FromMinutes(30); // thời gian session tồn tại
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
            });

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
            builder.Services.AddSingleton(resolver => resolver.GetRequiredService<IOptions<EmailSettings>>().Value);
            var app = builder.Build();

            // ✅ Middleware
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseCors("AllowAll");
            app.UseSession();

            app.UseAuthentication(); // ⚠️ Phải có trước Authorization
            app.UseAuthorization();

            app.MapControllers();
            app.MapHub<NotificationHub>("/hubs/notify");
            app.Run();
        }
    }
}
