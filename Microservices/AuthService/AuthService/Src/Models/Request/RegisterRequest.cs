namespace AuthService.Models;

public class RegisterRequest
{
    public required string Email { get; set; } // User's email address
    public required string Password { get; set; } // User's password
    public string? Name { get; set; } // User's full name (optional, depending on your requirements)
}