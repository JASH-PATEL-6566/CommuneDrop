namespace AuthService.Models;

public class LoginRequest
{
    public string Email { get; set; } // User's email address
    public string Password { get; set; } // User's password
}