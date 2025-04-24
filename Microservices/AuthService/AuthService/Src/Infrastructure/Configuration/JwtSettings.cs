namespace AuthService.infrastructure.configuration;

public class JwtSettings
{
    public required string Secret { get; set; } // The secret key used to sign the JWT
    public required string Issuer { get; set; } // The issuer of the JWT
    public required string Audience { get; set; } // The intended audience of the JWT
    public int ExpiryInMinutes { get; set; } // Token expiry time in minutes (optional)
}