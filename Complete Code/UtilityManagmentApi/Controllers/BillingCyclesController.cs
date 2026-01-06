using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UtilityManagmentApi.DTOs.BillingCycle;
using UtilityManagmentApi.Services.Interfaces;

namespace UtilityManagmentApi.Controllers;

/// <summary>
/// Billing Cycles Controller - Admin manages cycles, BillingOfficer reads for their work
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillingCyclesController : ControllerBase
{
    private readonly IBillingCycleService _billingCycleService;

    public BillingCyclesController(IBillingCycleService billingCycleService)
    {
        _billingCycleService = billingCycleService;
    }

    /// <summary>
    /// Get All Billing Cycles - Admin (manages), BillingOfficer (needs for readings)
    /// Billing Cycle Count in Admin Dashboard, Billing cycles (Jan, Feb, Mar) shown inside Generate Bills form inside single/bulk generate.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,BillingOfficer")]
    public async Task<IActionResult> GetAll([FromQuery] int? year = null)
    {
        var result = await _billingCycleService.GetAllAsync(year);
        return Ok(result);
    }

    /// <summary>
    /// In Admin, there is a Billing Cycle Section there this is called, Secondly in the billing officer dashboard, it gets called.
    /// </summary>
    [HttpGet("current")]
    [Authorize(Roles = "Admin,BillingOfficer")]
    public async Task<IActionResult> GetCurrentCycle()
    {
        var result = await _billingCycleService.GetCurrentCycleAsync();
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }
}
