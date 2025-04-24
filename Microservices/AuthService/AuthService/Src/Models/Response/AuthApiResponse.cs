namespace AuthService.Models.Response
{
    public class AuthApiResponse(int statuscode, bool success, string message, AuthData? data = null, List<string>? errors = null)
        : ApiResponse<AuthData>(statuscode, success, message, data, errors);
    public class AuthData
    {
        public required string Token { get; set; }
        public string? RefreshToken { get; set; }
    }
}