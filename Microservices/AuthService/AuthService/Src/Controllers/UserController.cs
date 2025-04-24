using AuthService.Models.Request;
using AuthService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Controllers;

[Route("auth/[controller]")]
[ApiController]
public class UserController(IUserService userService) : ControllerBase
{
    [Authorize]
    [HttpGet("details/{email}")]
    public async Task<IActionResult> GetUserDetails(string email)
    {
        var user = await userService.GetUserDetailsByEmailAsync(email);
        return Ok(user);
    }
    
    [Authorize]
    [HttpPut("update/{email}")]
    public async Task<IActionResult> UpdateUserDetails(string email, [FromBody] UpdateUserRequest model)
    {
        var result = await userService.UpdateUserDetailsByEmailAsync(email, model);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }
        return Ok(result);
    }
    
    [Authorize]
    [HttpDelete("delete/{email}")]
    public async Task<IActionResult> DeleteUser(string email)
    {
        var result = await userService.DeleteUserByEmailAsync(email);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }
        return Ok("User deleted successfully.");
    }
    
    [Authorize]
    [HttpPost("cards/{email}")]
    public async Task<IActionResult> CreateUserCard(string email, [FromBody] UpdateCardRequest cardRequest)
    {
        var result = await userService.CreateUserCardAsync(email, cardRequest);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }
        return CreatedAtAction(nameof(CreateUserCard), new { email }, result);
    }

    [Authorize]
    [HttpPut("cards/{email}/{cardId}")]
    public async Task<IActionResult> UpdateUserCard(string email, string cardId, [FromBody] UpdateCardRequest cardRequest)
    {
        var result = await userService.UpdateUserCardAsync(email, cardId, cardRequest);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }
        return Ok(result);
    }

    [Authorize]
    [HttpDelete("cards/{email}/{cardId}")]
    public async Task<IActionResult> DeleteUserCard(string email, string cardId)
    {
        var result = await userService.DeleteUserCardAsync(email, cardId);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }
        return Ok("Card deleted successfully.");
    }

    [Authorize]
    [HttpGet("cards/{email}")]
    public async Task<IActionResult> GetUserCards(string email)
    {
        var result = await userService.GetUserCardsAsync(email);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }
        return Ok(result);
    }
}