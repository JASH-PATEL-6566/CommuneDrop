using System.Text;
using AuthService.infrastructure.configuration;
using AuthService.Infrastructure.DbContext;
using AuthService.Infrastructure.Repositories;
using AuthService.Services;
using Duende.IdentityServer.Models;
using Microsoft.IdentityModel.Tokens;
using Serilog;

namespace AuthService.Extensions;

public static class ServiceExtensions
{
    public static void AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddLoggingServices();
        services.AddControllers();
        services.AddHttpContextAccessor();
        services.AddCorsPolicy();
        services.ConfigureIdentityServer(configuration);
        services.AddServices(configuration);
        services.AddAuthentication("Bearer")
            .AddJwtBearer(options =>
            {
                options.Authority = configuration.GetSection($"JwtSettings").GetValue<string>("Authority"); 
                options.Audience = configuration.GetSection($"JwtSettings").GetValue<string>("Audience");
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration.GetSection($"JwtSettings").GetValue<string>("Issuer"),
                    ValidAudience = configuration.GetSection("JwtSettings").GetValue<string>("Audience"),
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(configuration.GetSection("JwtSettings").GetValue<string>("Secret") ?? string.Empty)),
                };
            });
        services.AddAuthorizationBuilder().AddPolicy("RequireAuthenticatedUser", policy => policy.RequireAuthenticatedUser());
    }

    private static void AddLoggingServices(this IServiceCollection services)
    {
        services.AddLogging(loggingBuilder => loggingBuilder.AddSerilog());
    }

    private static void AddCorsPolicy(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll",
                builder => builder.AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader());
        });
    }

    private static void ConfigureIdentityServer(this IServiceCollection services, IConfiguration configuration)
    {
        var apiScopes = configuration.GetSection("IdentityServer:ApiScopes").Get<List<ApiScope>>() ?? new List<ApiScope>();
        var apiResources = configuration.GetSection("IdentityServer:ApiResources").Get<List<ApiResource>>() ?? new List<ApiResource>();
        var clientConfigs = configuration.GetSection("IdentityServer:Clients").Get<List<ClientConfig>>() ?? new List<ClientConfig>();
        if (clientConfigs.Count == 0)
        {
            throw new ArgumentException("IdentityServer Clients are missing in appsettings.json");
        }
        services.AddIdentityServer(options =>
        {
            options.KeyManagement.Enabled = false;
            options.Events.RaiseSuccessEvents = true;
            options.Events.RaiseFailureEvents = true;
            options.EmitStaticAudienceClaim = true;
        })
        .AddDeveloperSigningCredential()
        .AddInMemoryApiScopes(apiScopes)
        .AddInMemoryApiResources(apiResources)
        .AddInMemoryClients(clientConfigs.Select(client => new Client
        {
            ClientId = client.ClientId,
            ClientSecrets = { new Secret(client.ClientSecret.Sha256()) },
            AllowedGrantTypes = client.GrantType == "password" ? GrantTypes.ResourceOwnerPassword : GrantTypes.ClientCredentials,
            AllowedScopes = client.Scopes,
            AllowOfflineAccess = client.AllowOfflineAccess
        }).ToList());
    }

    private static void AddServices(this IServiceCollection services, IConfiguration configuration)
    {

        services.AddSingleton<MongoDbContext>(sp => new MongoDbContext(configuration.GetSection("MongoDbSettings").Get<MongoDbSettings>()));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IJwtService, JwtService>();
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
    }
}