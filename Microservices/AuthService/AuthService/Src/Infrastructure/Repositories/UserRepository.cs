using AuthService.infrastructure.configuration;
using AuthService.Infrastructure.DbContext;
using AuthService.Infrastructure.Entity;
using MongoDB.Driver;

namespace AuthService.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly MongoDbContext _context;

    public UserRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<User> GetUserByEmailAsync(string email)
    {
        return await _context.Users.Find(u => u.Email == email).FirstOrDefaultAsync();
    }
    
    public async Task<User> GetUserByIdAsync(string userId)
    {
        return await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
    }

    public async Task<User> AddUserAsync(User user)
    {
        await _context.Users.InsertOneAsync(user);
        return user;
    }

    public async Task<User> UpdateUserAsync(User user)
    {
        await _context.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
        return user;
    }
    
    public async Task<User> GetUserByRefreshTokenAsync(string refreshToken)
    {
        return await _context.Users.Find(u => u.RefreshToken == refreshToken).FirstOrDefaultAsync();
    }
    
    public async Task<bool> DeleteUserAsync(string email)
    {
        var result = await _context.Users.DeleteOneAsync(u => u.Email == email);
        return result.DeletedCount > 0; // Return true if a user was deleted
    }
}