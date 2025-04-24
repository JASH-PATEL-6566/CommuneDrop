using AuthService.Infrastructure.Entity;

namespace AuthService.Models.Response;

public class CardListApiResponse(
    int statusCode, 
    bool success, 
    string message, 
    List<Card>? data = null, 
    List<string>? errors = null
) : ApiResponse<List<Card>>(statusCode, success, message, data, errors);