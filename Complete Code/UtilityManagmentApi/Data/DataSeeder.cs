using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using UtilityManagmentApi.Entities;

namespace UtilityManagmentApi.Data;

/// <summary>
/// Database seeder for initial data including roles, users, and sample data
/// </summary>
public class DataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public DataSeeder(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager
    )
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task SeedAsync()
    {
        // Seed roles first
        await SeedRolesAsync();

        // Then seed users
        await SeedUsersAsync();

        // Finally seed other data in order (utility types -> tariffs -> consumers -> connections -> billing)
        await SeedUtilityTypesAsync();
        await SeedTariffPlansAsync();
        await SeedConsumersAsync();
        await SeedConnectionsAsync();
        await SeedBillingCycleAsync();
        await SeedMeterReadingsAndBillsAsync();
    }

    private async Task SeedRolesAsync()
    {
        foreach (var roleName in UserRoles.AllRoles)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                var role = new ApplicationRole(roleName)
                {
                    Description = roleName switch
                    {
                        UserRoles.Admin => "System Administrator with full access",
                        UserRoles.BillingOfficer =>
                            "Billing Officer - manages meter readings and bills",
                        UserRoles.AccountOfficer =>
                            "Account Officer - manages payments and reports",
                        UserRoles.Consumer => "Consumer - end user of utility services",
                        _ => roleName,
                    },
                };
                await _roleManager.CreateAsync(role);
            }
        }
    }

    private async Task SeedUsersAsync()
    {
        // Admin user
        await CreateUserIfNotExistsAsync(
            email: "admin@utilitybilling.com",
            password: "Admin@123",
            firstName: "Armaan",
            lastName: "Pandey",
            phone: "9812345678",
            role: UserRoles.Admin
        );

        // Billing Officer
        await CreateUserIfNotExistsAsync(
            email: "billing@utilitybilling.com",
            password: "Billing@123",
            firstName: "Manoj",
            lastName: "Yadav",
            phone: "9823456789",
            role: UserRoles.BillingOfficer
        );

        // Account Officer
        await CreateUserIfNotExistsAsync(
            email: "account@utilitybilling.com",
            password: "Account@123",
            firstName: "Kavita",
            lastName: "Rao",
            phone: "9834567890",
            role: UserRoles.AccountOfficer
        );

        // Consumer users
        await CreateUserIfNotExistsAsync(
            email: "ishaan.malhotra@mail.in",
            password: "Consumer@123",
            firstName: "Ishaan",
            lastName: "Malhotra",
            phone: "9845678901",
            role: UserRoles.Consumer
        );

        await CreateUserIfNotExistsAsync(
            email: "ananya.iyer@mail.in",
            password: "Consumer@123",
            firstName: "Ananya",
            lastName: "Iyer",
            phone: "9856789012",
            role: UserRoles.Consumer
        );

        await CreateUserIfNotExistsAsync(
            email: "rohan.joshi@mail.in",
            password: "Consumer@123",
            firstName: "Rohan",
            lastName: "Joshi",
            phone: "9867890123",
            role: UserRoles.Consumer
        );

        await CreateUserIfNotExistsAsync(
            email: "megha.kulkarni@mail.in",
            password: "Consumer@123",
            firstName: "Megha",
            lastName: "Kulkarni",
            phone: "9878901234",
            role: UserRoles.Consumer
        );

        await CreateUserIfNotExistsAsync(
            email: "tushar.kapoor@mail.in",
            password: "Consumer@123",
            firstName: "Tushar",
            lastName: "Kapoor",
            phone: "9889012345",
            role: UserRoles.Consumer
        );
    }

    private async Task<ApplicationUser?> CreateUserIfNotExistsAsync(
        string email,
        string password,
        string firstName,
        string lastName,
        string phone,
        string role
    )
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            return existingUser;
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = phone,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        var result = await _userManager.CreateAsync(user, password);
        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(user, role);
            return user;
        }

        return null;
    }

    private async Task SeedUtilityTypesAsync()
    {
        if (await _context.UtilityTypes.AnyAsync())
            return;

        var now = DateTime.UtcNow;
        var utilityTypes = new List<UtilityType>
        {
            new()
            {
                Name = "Electricity",
                Description = "Electric power supply",
                UnitOfMeasurement = "kWh",
                IsActive = true,
                CreatedAt = now,
            },
            new()
            {
                Name = "Water",
                Description = "Water supply",
                UnitOfMeasurement = "Liters",
                IsActive = true,
                CreatedAt = now,
            },
            new()
            {
                Name = "Gas",
                Description = "Natural gas supply",
                UnitOfMeasurement = "SCM",
                IsActive = true,
                CreatedAt = now,
            },
            new()
            {
                Name = "Internet",
                Description = "Internet services",
                UnitOfMeasurement = "GB",
                IsActive = true,
                CreatedAt = now,
            },
        };

        await _context.UtilityTypes.AddRangeAsync(utilityTypes);
        await _context.SaveChangesAsync();
    }

    private async Task SeedTariffPlansAsync()
    {
        if (await _context.TariffPlans.AnyAsync())
            return;

        var now = DateTime.UtcNow;
        var tariffPlans = new List<TariffPlan>
        {
            new()
            {
                Name = "Residential Electricity - Standard",
                Description = "Standard residential electricity tariff",
                UtilityTypeId = 1,
                RatePerUnit = 0.12m,
                FixedCharges = 10.00m,
                TaxPercentage = 8.00m,
                LatePaymentPenalty = 25.00m,
                IsActive = true,
                EffectiveFrom = new DateTime(2024, 1, 1),
                CreatedAt = now,
            },
            new()
            {
                Name = "Commercial Electricity - Standard",
                Description = "Standard commercial electricity tariff",
                UtilityTypeId = 1,
                RatePerUnit = 0.15m,
                FixedCharges = 25.00m,
                TaxPercentage = 10.00m,
                LatePaymentPenalty = 50.00m,
                IsActive = true,
                EffectiveFrom = new DateTime(2024, 1, 1),
                CreatedAt = now,
            },
            new()
            {
                Name = "Residential Water - Standard",
                Description = "Standard residential water tariff",
                UtilityTypeId = 2,
                RatePerUnit = 0.005m,
                FixedCharges = 5.00m,
                TaxPercentage = 5.00m,
                LatePaymentPenalty = 15.00m,
                IsActive = true,
                EffectiveFrom = new DateTime(2024, 1, 1),
                CreatedAt = now,
            },
            new()
            {
                Name = "Residential Gas - Standard",
                Description = "Standard residential gas tariff",
                UtilityTypeId = 3,
                RatePerUnit = 0.02m,
                FixedCharges = 8.00m,
                TaxPercentage = 6.00m,
                LatePaymentPenalty = 20.00m,
                IsActive = true,
                EffectiveFrom = new DateTime(2024, 1, 1),
                CreatedAt = now,
            },
            new()
            {
                Name = "Internet - Basic Plan",
                Description = "Basic internet plan - 100GB",
                UtilityTypeId = 4,
                RatePerUnit = 0.50m,
                FixedCharges = 29.99m,
                TaxPercentage = 8.00m,
                LatePaymentPenalty = 10.00m,
                IsActive = true,
                EffectiveFrom = new DateTime(2024, 1, 1),
                CreatedAt = now,
            },
        };

        await _context.TariffPlans.AddRangeAsync(tariffPlans);
        await _context.SaveChangesAsync();
    }

    private async Task SeedConsumersAsync()
    {
        if (await _context.Consumers.AnyAsync())
            return;

        var now = DateTime.UtcNow;

        // Get consumer users
        var ishaan = await _userManager.FindByEmailAsync("ishaan.malhotra@mail.in");
        var ananya = await _userManager.FindByEmailAsync("ananya.iyer@mail.in");
        var rohan = await _userManager.FindByEmailAsync("rohan.joshi@mail.in");
        var megha = await _userManager.FindByEmailAsync("megha.kulkarni@mail.in");
        var tushar = await _userManager.FindByEmailAsync("tushar.kapoor@mail.in");

        var consumers = new List<Consumer>();

        if (ishaan != null)
        {
            consumers.Add(
                new Consumer
                {
                    UserId = ishaan.Id,
                    ConsumerNumber = "CON240001",
                    Address = "Apartment 402, Skyline Heights",
                    City = "Pune",
                    State = "Maharashtra",
                    PostalCode = "411001",
                    RegistrationDate = now.AddMonths(-6),
                    IsActive = true,
                    CreatedAt = now,
                }
            );
        }

        if (ananya != null)
        {
            consumers.Add(
                new Consumer
                {
                    UserId = ananya.Id,
                    ConsumerNumber = "CON240002",
                    Address = "House No. 88, Anna Salai",
                    City = "Chennai",
                    State = "Tamil Nadu",
                    PostalCode = "600002",
                    RegistrationDate = now.AddMonths(-5),
                    IsActive = true,
                    CreatedAt = now,
                }
            );
        }

        if (rohan != null)
        {
            consumers.Add(
                new Consumer
                {
                    UserId = rohan.Id,
                    ConsumerNumber = "CON240003",
                    Address = "Suite 10, Business Park",
                    City = "Ahmedabad",
                    State = "Gujarat",
                    PostalCode = "380001",
                    RegistrationDate = now.AddMonths(-4),
                    IsActive = true,
                    CreatedAt = now,
                }
            );
        }

        if (megha != null)
        {
            consumers.Add(
                new Consumer
                {
                    UserId = megha.Id,
                    ConsumerNumber = "CON240004",
                    Address = "B-405, Sterling Towers",
                    City = "Indore",
                    State = "Madhya Pradesh",
                    PostalCode = "452001",
                    RegistrationDate = now.AddMonths(-3),
                    IsActive = true,
                    CreatedAt = now,
                }
            );
        }

        if (tushar != null)
        {
            consumers.Add(
                new Consumer
                {
                    UserId = tushar.Id,
                    ConsumerNumber = "CON240005",
                    Address = "Villa 7, Palm Grove Estate",
                    City = "Lucknow",
                    State = "Uttar Pradesh",
                    PostalCode = "226001",
                    RegistrationDate = now.AddMonths(-2),
                    IsActive = true,
                    CreatedAt = now,
                }
            );
        }

        if (consumers.Any())
        {
            await _context.Consumers.AddRangeAsync(consumers);
            await _context.SaveChangesAsync();
        }
    }

    private async Task SeedConnectionsAsync()
    {
        if (await _context.Connections.AnyAsync())
            return;

        var now = DateTime.UtcNow;
        var consumers = await _context.Consumers.ToListAsync();

        if (!consumers.Any())
            return;

        var connections = new List<Connection>();

        // Consumer 1 (Ishaan)
        var consumer1 = consumers.FirstOrDefault(c => c.ConsumerNumber == "CON240001");
        if (consumer1 != null)
        {
            connections.Add(
                new Connection
                {
                    ConsumerId = consumer1.Id,
                    UtilityTypeId = 1,
                    TariffPlanId = 1,
                    MeterNumber = "ELE-M001",
                    ConnectionNumber = "ELE240001",
                    ConnectionDate = now.AddMonths(-6),
                    Status = ConnectionStatus.Active,
                    LoadSanctioned = 5.0m,
                    InstallationAddress = "Apartment 402, Skyline Heights, Pune, MH 411001",
                    CreatedAt = now,
                }
            );
            connections.Add(
                new Connection
                {
                    ConsumerId = consumer1.Id,
                    UtilityTypeId = 2,
                    TariffPlanId = 3,
                    MeterNumber = "WAT-M001",
                    ConnectionNumber = "WAT240001",
                    ConnectionDate = now.AddMonths(-6),
                    Status = ConnectionStatus.Active,
                    InstallationAddress = "Apartment 402, Skyline Heights, Pune, MH 411001",
                    CreatedAt = now,
                }
            );
        }

        // Consumer 2 (Ananya)
        var consumer2 = consumers.FirstOrDefault(c => c.ConsumerNumber == "CON240002");
        if (consumer2 != null)
        {
            connections.Add(
                new Connection
                {
                    ConsumerId = consumer2.Id,
                    UtilityTypeId = 1,
                    TariffPlanId = 1,
                    MeterNumber = "ELE-M002",
                    ConnectionNumber = "ELE240002",
                    ConnectionDate = now.AddMonths(-5),
                    Status = ConnectionStatus.Active,
                    LoadSanctioned = 7.0m,
                    InstallationAddress = "House No. 88, Anna Salai, Chennai, TN 600002",
                    CreatedAt = now,
                }
            );
            connections.Add(
                new Connection
                {
                    ConsumerId = consumer2.Id,
                    UtilityTypeId = 3,
                    TariffPlanId = 4,
                    MeterNumber = "GAS-M001",
                    ConnectionNumber = "GAS240001",
                    ConnectionDate = now.AddMonths(-5),
                    Status = ConnectionStatus.Active,
                    InstallationAddress = "House No. 88, Anna Salai, Chennai, TN 600002",
                    CreatedAt = now,
                }
            );
        }

        // Consumer 3 (Rohan)
        var consumer3 = consumers.FirstOrDefault(c => c.ConsumerNumber == "CON240003");
        if (consumer3 != null)
        {
            connections.Add(
                new Connection
                {
                    ConsumerId = consumer3.Id,
                    UtilityTypeId = 1,
                    TariffPlanId = 2,
                    MeterNumber = "ELE-M003",
                    ConnectionNumber = "ELE240003",
                    ConnectionDate = now.AddMonths(-4),
                    Status = ConnectionStatus.Active,
                    LoadSanctioned = 25.0m,
                    InstallationAddress = "Suite 10, Business Park, Ahmedabad, GJ 380001",
                    CreatedAt = now,
                }
            );
        }

        // Consumer 4 (Megha)
        var consumer4 = consumers.FirstOrDefault(c => c.ConsumerNumber == "CON240004");
        if (consumer4 != null)
        {
            connections.Add(
                new Connection
                {
                    ConsumerId = consumer4.Id,
                    UtilityTypeId = 1,
                    TariffPlanId = 1,
                    MeterNumber = "ELE-M004",
                    ConnectionNumber = "ELE240004",
                    ConnectionDate = now.AddMonths(-3),
                    Status = ConnectionStatus.Active,
                    LoadSanctioned = 5.0m,
                    InstallationAddress = "B-405, Sterling Towers, Indore, MP 452001",
                    CreatedAt = now,
                }
            );
            connections.Add(
                new Connection
                {
                    ConsumerId = consumer4.Id,
                    UtilityTypeId = 4,
                    TariffPlanId = 5,
                    MeterNumber = "INT-M001",
                    ConnectionNumber = "INT240001",
                    ConnectionDate = now.AddMonths(-3),
                    Status = ConnectionStatus.Active,
                    InstallationAddress = "B-405, Sterling Towers, Indore, MP 452001",
                    CreatedAt = now,
                }
            );
        }

        // Consumer 5 (Tushar)
        var consumer5 = consumers.FirstOrDefault(c => c.ConsumerNumber == "CON240005");
        if (consumer5 != null)
        {
            connections.Add(
                new Connection
                {
                    ConsumerId = consumer5.Id,
                    UtilityTypeId = 1,
                    TariffPlanId = 1,
                    MeterNumber = "ELE-M005",
                    ConnectionNumber = "ELE240005",
                    ConnectionDate = now.AddMonths(-2),
                    Status = ConnectionStatus.Active,
                    LoadSanctioned = 5.0m,
                    InstallationAddress = "Villa 7, Palm Grove Estate, Lucknow, UP 226001",
                    CreatedAt = now,
                }
            );
            connections.Add(
                new Connection
                {
                    ConsumerId = consumer5.Id,
                    UtilityTypeId = 2,
                    TariffPlanId = 3,
                    MeterNumber = "WAT-M002",
                    ConnectionNumber = "WAT240002",
                    ConnectionDate = now.AddMonths(-2),
                    Status = ConnectionStatus.Active,
                    InstallationAddress = "Villa 7, Palm Grove Estate, Lucknow, UP 226001",
                    CreatedAt = now,
                }
            );
        }

        if (connections.Any())
        {
            await _context.Connections.AddRangeAsync(connections);
            await _context.SaveChangesAsync();
        }
    }

    private async Task SeedBillingCycleAsync()
    {
        if (await _context.BillingCycles.AnyAsync())
            return;

        var now = DateTime.UtcNow;
        var billingCycles = new List<BillingCycle>();

        var startYear = 2025;
        var startMonth = 1;
        var currentYear = now.Year;
        var currentMonth = now.Month;

        for (var year = startYear; year <= currentYear; year++)
        {
            var monthStart = (year == startYear) ? startMonth : 1;
            var monthEnd = (year == currentYear) ? currentMonth : 12;

            for (var month = monthStart; month <= monthEnd; month++)
            {
                var monthName = new DateTime(year, month, 1).ToString("MMMM yyyy");
                var daysInMonth = DateTime.DaysInMonth(year, month);

                var nextMonth = month == 12 ? 1 : month + 1;
                var nextYear = month == 12 ? year + 1 : year;

                var billingCycle = new BillingCycle
                {
                    Name = monthName,
                    Month = month,
                    Year = year,
                    StartDate = new DateOnly(year, month, 1),
                    EndDate = new DateOnly(year, month, daysInMonth),
                    BillGenerationDate = new DateOnly(nextYear, nextMonth, 5),
                    DueDate = new DateOnly(nextYear, nextMonth, 20),
                    Status = BillingCycleStatus.Open,
                    CreatedAt = DateTime.UtcNow,
                };

                billingCycles.Add(billingCycle);
            }
        }

        if (billingCycles.Any())
        {
            await _context.BillingCycles.AddRangeAsync(billingCycles);
            await _context.SaveChangesAsync();
        }
    }

    private async Task SeedMeterReadingsAndBillsAsync()
    {
        if (await _context.Bills.AnyAsync())
            return;

        var now = DateTime.UtcNow;
        var billingOfficer = await _userManager.FindByEmailAsync("manoj.yadav@utility.in");
        if (billingOfficer == null)
            return;

        var connections = await _context
            .Connections.Include(c => c.TariffPlan)
            .Include(c => c.UtilityType)
            .Where(c => c.Status == ConnectionStatus.Active)
            .ToListAsync();

        if (!connections.Any())
            return;

        var meterReadings = new List<MeterReading>();
        var bills = new List<Bill>();
        var billNumber = 1;

        var novemberCycle = await _context.BillingCycles.FirstOrDefaultAsync(bc =>
            bc.Month == 11 && bc.Year == 2025
        );

        if (novemberCycle != null)
        {
            foreach (var connection in connections.Take(3))
            {
                var previousReading = 0m;
                var currentReading = 1000m + (billNumber * 100);
                var unitsConsumed = currentReading - previousReading;

                var meterReading = new MeterReading
                {
                    ConnectionId = connection.Id,
                    ReadingDate = new DateTime(2025, 11, 30),
                    CurrentReading = currentReading,
                    PreviousReading = previousReading,
                    UnitsConsumed = unitsConsumed,
                    BillingMonth = 11,
                    BillingYear = 2025,
                    IsEstimated = false,
                    ReadByUserId = billingOfficer.Id,
                    CreatedAt = now.AddDays(-35),
                };
                meterReadings.Add(meterReading);

                var ratePerUnit = connection.TariffPlan.RatePerUnit;
                var fixedCharges = connection.TariffPlan.FixedCharges;
                var taxRate = connection.TariffPlan.TaxPercentage;
                var energyCharges = unitsConsumed * ratePerUnit;
                var taxAmount = (energyCharges + fixedCharges) * (taxRate / 100);
                var totalAmount = energyCharges + fixedCharges + taxAmount;

                var dueDateValue =
                    billNumber == 1 ? new DateOnly(2025, 12, 8) : new DateOnly(2025, 12, 20);

                var bill = new Bill
                {
                    BillNumber = $"BILL25{11:D2}{billNumber:D6}",
                    ConnectionId = connection.Id,
                    BillingMonth = 11,
                    BillingYear = 2025,
                    BillDate = new DateOnly(2025, 12, 1),
                    DueDate = dueDateValue,
                    PreviousReading = previousReading,
                    CurrentReading = currentReading,
                    UnitsConsumed = unitsConsumed,
                    RatePerUnit = ratePerUnit,
                    EnergyCharges = energyCharges,
                    FixedCharges = fixedCharges,
                    TaxAmount = taxAmount,
                    PenaltyAmount = 0,
                    PreviousBalance = 0,
                    TotalAmount = totalAmount,
                    AmountPaid = 0,
                    OutstandingBalance = totalAmount,
                    Status = BillStatus.Due,
                    GeneratedByUserId = billingOfficer.Id,
                    CreatedAt = now.AddDays(-27),
                };
                bills.Add(bill);
                billNumber++;
            }
        }

        var decemberCycle = await _context.BillingCycles.FirstOrDefaultAsync(bc =>
            bc.Month == 12 && bc.Year == 2025
        );

        if (decemberCycle != null)
        {
            foreach (var connection in connections.Skip(3).Take(2))
            {
                var previousReading = 500m;
                var currentReading = 1500m + (billNumber * 50);
                var unitsConsumed = currentReading - previousReading;

                var meterReading = new MeterReading
                {
                    ConnectionId = connection.Id,
                    ReadingDate = new DateTime(2025, 12, 31),
                    CurrentReading = currentReading,
                    PreviousReading = previousReading,
                    UnitsConsumed = unitsConsumed,
                    BillingMonth = 12,
                    BillingYear = 2025,
                    IsEstimated = false,
                    ReadByUserId = billingOfficer.Id,
                    CreatedAt = now.AddDays(-5),
                };
                meterReadings.Add(meterReading);

                var ratePerUnit = connection.TariffPlan.RatePerUnit;
                var fixedCharges = connection.TariffPlan.FixedCharges;
                var taxRate = connection.TariffPlan.TaxPercentage;
                var energyCharges = unitsConsumed * ratePerUnit;
                var taxAmount = (energyCharges + fixedCharges) * (taxRate / 100);
                var totalAmount = energyCharges + fixedCharges + taxAmount;

                var bill = new Bill
                {
                    BillNumber = $"BILL25{12:D2}{billNumber:D6}",
                    ConnectionId = connection.Id,
                    BillingMonth = 12,
                    BillingYear = 2025,
                    BillDate = new DateOnly(2026, 1, 1),
                    DueDate = new DateOnly(2026, 1, 8),
                    PreviousReading = previousReading,
                    CurrentReading = currentReading,
                    UnitsConsumed = unitsConsumed,
                    RatePerUnit = ratePerUnit,
                    EnergyCharges = energyCharges,
                    FixedCharges = fixedCharges,
                    TaxAmount = taxAmount,
                    PenaltyAmount = 0,
                    PreviousBalance = 0,
                    TotalAmount = totalAmount,
                    AmountPaid = 0,
                    OutstandingBalance = totalAmount,
                    Status = BillStatus.Due,
                    GeneratedByUserId = billingOfficer.Id,
                    CreatedAt = now,
                };
                bills.Add(bill);
                billNumber++;
            }
        }

        if (meterReadings.Any())
        {
            await _context.MeterReadings.AddRangeAsync(meterReadings);
            await _context.SaveChangesAsync();
            for (int i = 0; i < bills.Count && i < meterReadings.Count; i++)
            {
                bills[i].MeterReadingId = meterReadings[i].Id;
            }
        }

        if (bills.Any())
        {
            await _context.Bills.AddRangeAsync(bills);
            await _context.SaveChangesAsync();
        }
    }
}
