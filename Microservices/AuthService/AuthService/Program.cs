using AuthService.Extensions;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();
builder.Services.AddApplicationServices(builder.Configuration);
var app = builder.Build();
app.UsePathBase("/auth");
app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseIdentityServer();
app.UseAuthorization();
app.MapControllers();
await app.RunAsync();