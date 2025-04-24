using AuthService.Models;
using AuthService.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AuthService.Models.Request;
using Microsoft.AspNetCore.Authentication.Google;

namespace AuthService.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(IUserService userService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await userService.RegisterUser(request);
        if (!result.Success)
            return BadRequest(result.Message);
        return Ok(result);
    }
    
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await userService.LoginUser(request);
        if (!result.Success)
            return Unauthorized(result);
        return Ok(result);
    }
    
    [HttpGet("google-login")]
    public IActionResult GoogleLogin()
    {
        var redirectUrl = Url.Action("GoogleResponse", "Auth");
        var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }
    
    [HttpGet("google-response")]
    public async Task<IActionResult> GoogleResponse()
    {
        var authenticateResult = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
        if (!authenticateResult.Succeeded)
            return BadRequest("Google authentication failed.");
        var email = authenticateResult.Principal.FindFirst(ClaimTypes.Email)?.Value;
        var name = authenticateResult.Principal.FindFirst(ClaimTypes.Name)?.Value;
        if (string.IsNullOrEmpty(email))
            return BadRequest("Email not found in Google response.");
        var user = await userService.FindUserByEmail(email);
        if (user == null)
        {
            var registerRequest = new RegisterRequest
            {
                Email = email,
                Password = "GoogleAuth",
                Name = name
            };
            var registerResult = await userService.RegisterUser(registerRequest);
            if (!registerResult.Success)
                return BadRequest(registerResult.Message);
        }
        var loginRequest = new LoginRequest
        {
            Email = email,
            Password = "GoogleAuth"
        };
        var loginResult = await userService.LoginUser(loginRequest);
        if (!loginResult.Success)
            return Unauthorized(loginResult.Message);
        return Ok(loginResult);
    }
    
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken))
            return BadRequest("Refresh token is required.");
        var result = await userService.RefreshToken(request.RefreshToken);
        if (!result.Success)
            return Unauthorized(result.Message);
    
        return Ok(result);
    }
    
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var email = User.Identity?.Name;
        if (string.IsNullOrEmpty(email))
            return Unauthorized("User not authenticated.");
        var result = await userService.LogoutUser(email);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}