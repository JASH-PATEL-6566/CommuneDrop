using System.Security.Claims;

namespace AuthService.Services;

public interface IJwtService
{
    string GenerateToken(IEnumerable<Claim> claims);
    ClaimsPrincipal? ValidateToken(string token);
}