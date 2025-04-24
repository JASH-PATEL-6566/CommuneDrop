using AuthService.Infrastructure.Entity;
using AuthService.Models;
using AuthService.Models.Request;
using AuthService.Models.Response;

namespace AuthService.Services
{
    public interface IUserService
    {
        // Authentication Methods
        Task<AuthApiResponse> RegisterUser(RegisterRequest request);
        Task<AuthApiResponse> LoginUser(LoginRequest request);
        Task<AuthApiResponse> RefreshToken(string refreshToken);
        Task<AuthApiResponse> LogoutUser(string email);
        Task<User> FindUserByEmail(string email);

        // User Management Methods
        Task<UserApiResponse> GetUserDetailsByEmailAsync(string email);
        Task<UserApiResponse> UpdateUserDetailsByEmailAsync(string email, UpdateUserRequest model);
        Task<UserApiResponse> DeleteUserByEmailAsync(string email);

        // Card Management Methods
        Task<CardApiResponse> CreateUserCardAsync(string email, UpdateCardRequest cardRequest);
        Task<CardApiResponse> UpdateUserCardAsync(string email, string cardId, UpdateCardRequest cardRequest);
        Task<CardApiResponse> DeleteUserCardAsync(string email, string cardId);
        Task<CardListApiResponse> GetUserCardsAsync(string email);
    }
}