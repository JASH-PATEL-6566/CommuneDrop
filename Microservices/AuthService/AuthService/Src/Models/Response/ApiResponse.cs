namespace AuthService.Models.Response
{
    public class ApiResponse<T>(int statuscode,bool success, string message, T? data = default, List<string>? errors = null)
    {
        public int StatusCode { get; set; } = statuscode;
        public bool Success { get; set; } = success;
        public string Message { get; set; } = message;
        public T? Data { get; set; } = data;
        public List<string>? Errors { get; set; } = errors ?? new List<string>();
    }
}