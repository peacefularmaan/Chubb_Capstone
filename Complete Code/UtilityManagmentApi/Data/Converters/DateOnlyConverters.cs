using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace UtilityManagmentApi.Data.Converters;

/// <summary>
/// Converts DateOnly to DateTime for SQL Server storage
/// </summary>
public class DateOnlyConverter : ValueConverter<DateOnly, DateTime>
{
    public DateOnlyConverter() : base(
        dateOnly => dateOnly.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
    dateTime => DateOnly.FromDateTime(dateTime.Kind == DateTimeKind.Utc ? dateTime : DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)))
    {
    }
}

/// <summary>
/// Converts nullable DateOnly to nullable DateTime for SQL Server storage
/// </summary>
public class NullableDateOnlyConverter : ValueConverter<DateOnly?, DateTime?>
{
    public NullableDateOnlyConverter() : base(
 dateOnly => dateOnly.HasValue ? dateOnly.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc) : null,
        dateTime => dateTime.HasValue ? DateOnly.FromDateTime(dateTime.Value.Kind == DateTimeKind.Utc ? dateTime.Value : DateTime.SpecifyKind(dateTime.Value, DateTimeKind.Utc)) : null)
    {
  }
}

/// <summary>
/// EF Core value converter that ensures DateTime values are stored and retrieved as UTC
/// </summary>
public class UtcDateTimeDbConverter : ValueConverter<DateTime, DateTime>
{
    public UtcDateTimeDbConverter() : base(
        // When saving to DB, ensure it's UTC
        v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
        // When reading from DB, mark as UTC (SQL Server doesn't store timezone info)
        v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
    {
    }
}

/// <summary>
/// EF Core value converter for nullable DateTime that ensures UTC handling
/// </summary>
public class NullableUtcDateTimeDbConverter : ValueConverter<DateTime?, DateTime?>
{
    public NullableUtcDateTimeDbConverter() : base(
        v => v.HasValue 
            ? (v.Value.Kind == DateTimeKind.Utc ? v.Value : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)) 
            : null,
        v => v.HasValue 
            ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) 
            : null)
    {
    }
}
