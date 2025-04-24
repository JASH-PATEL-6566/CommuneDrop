namespace AuthService.infrastructure.configuration;

public class ClientConfig
{
    public required string ClientId { get; set; }
    public required string ClientSecret { get; set; }
    public required string GrantType { get; set; }
    public required List<string> Scopes { get; set; }
    public bool AllowOfflineAccess { get; set; } = false;
    public int AccessTokenLifetime { get; set; } = 3600;
    public bool RefreshTokenExpiration { get; set; } = true;
    public bool RefreshTokenReuse { get; set; } = true;
}