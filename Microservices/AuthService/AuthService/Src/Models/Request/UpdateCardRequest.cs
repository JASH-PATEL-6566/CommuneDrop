namespace AuthService.Models.Request;

public class UpdateCardRequest
{
    public required string CardNumber { get; set; }
    public required string CardholderName { get; set; }
    public required string ExpiryDate { get; set; }
    public required string CVV { get; set; }
    public bool IsDefault { get; set; }
}