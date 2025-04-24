using AuthService.Infrastructure.Entity;

namespace AuthService.Models.Response
{
    public class UserApiResponse(int statuscode, bool success, string message, User? data = null, List<string>? errors = null)
        : ApiResponse<User>(statuscode, success, message, data, errors);
}