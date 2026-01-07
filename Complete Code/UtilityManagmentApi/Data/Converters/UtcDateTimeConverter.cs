using System.Text.Json;
using System.Text.Json.Serialization;

namespace UtilityManagmentApi.Data.Converters;

/// <summary>
/// JSON converter that ensures DateTime values are serialized with UTC timezone indicator (Z suffix)
/// This fixes the issue where dates appear with wrong times on the frontend
/// </summary>
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var dateTime = reader.GetDateTime();
        // Ensure we treat the date as UTC
        return dateTime.Kind == DateTimeKind.Unspecified 
            ? DateTime.SpecifyKind(dateTime, DateTimeKind.Utc) 
            : dateTime.ToUniversalTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // Ensure UTC dates are written with Z suffix
        var utcDateTime = value.Kind == DateTimeKind.Utc 
            ? value 
            : value.Kind == DateTimeKind.Local 
                ? value.ToUniversalTime() 
                : DateTime.SpecifyKind(value, DateTimeKind.Utc);
        
        writer.WriteStringValue(utcDateTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
    }
}

/// <summary>
/// JSON converter for nullable DateTime that ensures UTC timezone handling
/// </summary>
public class NullableUtcDateTimeConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;
            
        var dateTime = reader.GetDateTime();
        return dateTime.Kind == DateTimeKind.Unspecified 
            ? DateTime.SpecifyKind(dateTime, DateTimeKind.Utc) 
            : dateTime.ToUniversalTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }
        
        var utcDateTime = value.Value.Kind == DateTimeKind.Utc 
            ? value.Value 
            : value.Value.Kind == DateTimeKind.Local 
                ? value.Value.ToUniversalTime() 
                : DateTime.SpecifyKind(value.Value, DateTimeKind.Utc);
        
        writer.WriteStringValue(utcDateTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
    }
}
