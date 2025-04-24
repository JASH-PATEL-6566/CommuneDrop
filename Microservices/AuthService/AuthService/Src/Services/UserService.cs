using System.Security.Claims;
using AuthService.Infrastructure.Entity;
using AuthService.Models.Request;
using AuthService.Models.Response;

namespace AuthService.Services;

using Models;
using Infrastructure.Repositories;
using System;
using System.Threading.Tasks;
using BCrypt.Net;

public class UserService(IUserRepository userRepository, IJwtService jwtService) : IUserService
{
    public async Task<AuthApiResponse> RegisterUser(RegisterRequest request)
    {
        var existingUser = await userRepository.GetUserByEmailAsync(request.Email);
        if (existingUser != null)
            return new AuthApiResponse(400,true, "User already exists.", null);
        var hashedPassword = BCrypt.HashPassword(request.Password);
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = request.Email,
            PasswordHash = hashedPassword,
            Name = request.Name,
            RefreshToken = GenerateRefreshToken(),
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(7) // Set refresh token expiry
        };
        await userRepository.AddUserAsync(user);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };
        var token = jwtService.GenerateToken(claims);
        return new AuthApiResponse(201,true, "User registered successfully.", new AuthData { Token = token, RefreshToken = user.RefreshToken });
    }

    public async Task<AuthApiResponse> LoginUser(LoginRequest request)
    {
        var user = await userRepository.GetUserByEmailAsync(request.Email);
        if (user == null)
            return new AuthApiResponse(404,false, $"User not found.", null);
        if (!BCrypt.Verify(request.Password, user.PasswordHash))
            return new AuthApiResponse(401, false, "Invalid password.", null);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };
        var token = jwtService.GenerateToken(claims);
        return new AuthApiResponse(200,true, "User logged in successfully.", new AuthData { Token = token, RefreshToken = user.RefreshToken });
    }

    public async Task<AuthApiResponse> RefreshToken(string refreshToken)
    {
        var user = await userRepository.GetUserByRefreshTokenAsync(refreshToken);
        if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            return new AuthApiResponse(400, false, "Invalid or expired refresh token.", null);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };
        var token = jwtService.GenerateToken(claims);
        return new AuthApiResponse(200, true, "Token refreshed successfully.", new AuthData { Token = token, RefreshToken = user.RefreshToken });
    }

    public async Task<AuthApiResponse> LogoutUser(string email)
    {
        var user = await userRepository.GetUserByEmailAsync(email);
        if (user == null)
            return new AuthApiResponse(404, false, $"User not found.", null);
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await userRepository.UpdateUserAsync(user);
        return new AuthApiResponse(200, true, "User logged out successfully.", null);
    }

    public async Task<User> FindUserByEmail(string email)
    {
        return await userRepository.GetUserByEmailAsync(email);
    }
    
    // New Method: Get User Details by Email
    public async Task<UserApiResponse> GetUserDetailsByEmailAsync(string email)
    {
        var user = await userRepository.GetUserByEmailAsync(email);
        return user == null ? new UserApiResponse(404,false, $"User not found.", null) : 
            new UserApiResponse(200, true, "User details fetched successfully.", user);
    }
    
    public async Task<UserApiResponse> UpdateUserDetailsByEmailAsync(string email, UpdateUserRequest model)
    {
        var user = await userRepository.GetUserByEmailAsync(email);
        if (user == null)
        {
            return new UserApiResponse(404,false, $"User not found.", null);
        }
        if (!string.IsNullOrEmpty(model.Name))
            user.Name = model.Name;
        if (!string.IsNullOrEmpty(model.ProfilePictureUrl))
            user.ProfilePicture = model.ProfilePictureUrl;
        if (!string.IsNullOrEmpty(model.PhoneNumber))
            user.PhoneNumber = model.PhoneNumber;
        if (!string.IsNullOrEmpty(model.Address))
            user.Address = model.Address;
        await userRepository.UpdateUserAsync(user);
        return new UserApiResponse(200, true, "User details updated successfully.", user);
    }
    
    public async Task<UserApiResponse> DeleteUserByEmailAsync(string email)
    {
        var user = await userRepository.GetUserByEmailAsync(email);
        if (user == null)
        {
            return new UserApiResponse(404,false, "User not found.", null);
        }
        var deleteSuccess = await userRepository.DeleteUserAsync(user.Email);
        return !deleteSuccess ? new UserApiResponse(400,false, "Failed to delete user.", null) 
            : new UserApiResponse(200, true, "User deleted successfully.", null);
    }
    
    public async Task<CardApiResponse> CreateUserCardAsync(string email, UpdateCardRequest cardRequest)
    {
        var user = await userRepository.GetUserByEmailAsync(email);
        if (user == null)
        {
            return new CardApiResponse(404, false, "User not found.");
        }
        if (!ValidateCardDetails(cardRequest))
        {
            return new CardApiResponse(400, false, "Invalid card details.");
        }
        var newCard = new Card
        {
            Id = Guid.NewGuid().ToString(),
            UserId = user.Id,
            CardNumber = cardRequest.CardNumber,
            CardholderName = cardRequest.CardholderName,
            ExpiryDate = cardRequest.ExpiryDate,
            CVV = cardRequest.CVV,
            IsDefault = cardRequest.IsDefault,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        if (cardRequest.IsDefault)
        {
            await UnsetOtherDefaultCards(user.Id, newCard.Id);
        }
        user.Cards ??= new List<Card>();
        user.Cards.Add(newCard);
        await userRepository.UpdateUserAsync(user);
        return new CardApiResponse(201, true, "Card added successfully.", newCard);
    }

    public async Task<CardApiResponse> UpdateUserCardAsync(string email, string cardId, UpdateCardRequest cardRequest)
    {
        var user = await userRepository.GetUserByEmailAsync(email);
        if (user == null)
        {
            return new CardApiResponse(404, false, "User not found.");
        }
        var cardToUpdate = user.Cards?.FirstOrDefault(c => c.Id == cardId);
        if (cardToUpdate == null)
        {
            return new CardApiResponse(404, false, "Card not found.");
        }
        if (!ValidateCardDetails(cardRequest))
        {
            return new CardApiResponse(400, false, "Invalid card details.");
        }
        cardToUpdate.CardNumber = cardRequest.CardNumber;
        cardToUpdate.CardholderName = cardRequest.CardholderName;
        cardToUpdate.ExpiryDate = cardRequest.ExpiryDate;
        cardToUpdate.CVV = cardRequest.CVV;
        cardToUpdate.UpdatedAt = DateTime.UtcNow;
        if (cardRequest.IsDefault)
        {
            await UnsetOtherDefaultCards(user.Id, cardId);
            cardToUpdate.IsDefault = true;
        }
        await userRepository.UpdateUserAsync(user);
        return new CardApiResponse(200, true, "Card updated successfully.", cardToUpdate);
    }

    public async Task<CardApiResponse> DeleteUserCardAsync(string email, string cardId)
    {
        var user = await userRepository.GetUserByEmailAsync(email);
        if (user == null)
        {
            return new CardApiResponse(404, false, "User not found.");
        }
        var cardToDelete = user.Cards?.FirstOrDefault(c => c.Id == cardId);
        if (cardToDelete == null)
        {
            return new CardApiResponse(404, false, "Card not found.");
        }
        user.Cards?.Remove(cardToDelete);
        await userRepository.UpdateUserAsync(user);
        return new CardApiResponse(200, true, "Card deleted successfully.");
    }

    public async Task<CardListApiResponse> GetUserCardsAsync(string email)
    {
        var user = await userRepository.GetUserByEmailAsync(email);
        if (user == null)
        {
            return new CardListApiResponse(404, false, "User not found.");
        }
        return new CardListApiResponse(200, true, "Cards retrieved successfully.", user.Cards ?? new List<Card>());
    }

    private static bool ValidateCardDetails(UpdateCardRequest cardRequest)
    {
        return !string.IsNullOrWhiteSpace(cardRequest.CardNumber) &&
               !string.IsNullOrWhiteSpace(cardRequest.CardholderName) &&
               !string.IsNullOrWhiteSpace(cardRequest.ExpiryDate) &&
               !string.IsNullOrWhiteSpace(cardRequest.CVV);
    }

    private async Task UnsetOtherDefaultCards(string userId, string exceptCardId)
    {
        var user = await userRepository.GetUserByIdAsync(userId);
        if (user?.Cards != null)
        {
            foreach (var card in user.Cards.Where(c => c.Id != exceptCardId))
            {
                card.IsDefault = false;
            }
            await userRepository.UpdateUserAsync(user);
        }
    }

    private static string GenerateRefreshToken()
    {
        return Guid.NewGuid().ToString();
    }
}