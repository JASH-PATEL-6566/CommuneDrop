using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.Infrastructure.Entity;

public class Card
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required]
    [ForeignKey("User")]
    public required string UserId { get; set; }
    [Required]
    [StringLength(16, MinimumLength = 12)]
    public required string CardNumber { get; set; }
    [Required]
    [StringLength(100)]
    public required string CardholderName { get; set; }
    [Required]
    [StringLength(5)] // Format MM/YY
    public required string ExpiryDate { get; set; }
    [Required]
    [StringLength(4)]
    public required string CVV { get; set; }
    public bool IsDefault { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}