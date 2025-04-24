namespace AuthService.Models.Request;

public class RefreshTokenRequest
{
    public required string RefreshToken { get; set; }
}