using AuthService.Infrastructure.Entity;

namespace AuthService.Models.Response;

public class CardApiResponse(
    int statusCode, 
    bool success, 
    string message, 
    Card? data = null, 
    List<string>? errors = null
) : ApiResponse<Card>(statusCode, success, message, data, errors);