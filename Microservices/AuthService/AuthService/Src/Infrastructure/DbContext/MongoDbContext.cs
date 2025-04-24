using AuthService.infrastructure.configuration;
using AuthService.Infrastructure.Entity;
using MongoDB.Driver;

namespace AuthService.Infrastructure.DbContext;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(MongoDbSettings? settings)
    {
        var client = new MongoClient(settings.ConnectionString);
        _database = client.GetDatabase(settings.DatabaseName);
    }

    public IMongoCollection<User> Users => _database.GetCollection<User>("Users");
}
