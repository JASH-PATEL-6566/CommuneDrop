using AuthService.Infrastructure.Entity;

namespace AuthService.Infrastructure.Repositories;

public interface IUserRepository
{
    Task<User> GetUserByEmailAsync(string email);
    Task<User> GetUserByIdAsync(string userId);
    Task<User> AddUserAsync(User user);
    Task<User> UpdateUserAsync(User user);
    Task<User> GetUserByRefreshTokenAsync(string refreshToken);
    Task<bool> DeleteUserAsync(string email);
}