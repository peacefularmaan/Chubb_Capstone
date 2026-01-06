# 🏠 Utility Billing System

A full-stack **Utility Billing and Management System** built with **Angular 21** (Frontend) and **.NET 9 Web API** (Backend). This application enables efficient management of utility services including billing cycles, meter readings, payments, consumer management, and more.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)

---

## 🌟 Overview

The Utility Management System is designed to streamline the operations of utility service providers. It provides a comprehensive solution for managing consumers, tracking utility consumption through meter readings, generating bills, processing payments, and handling connection requests.

---

## ✨ Features

- **User Authentication & Authorization** - JWT-based secure authentication with role-based access control
- **Consumer Management** - Register and manage utility consumers
- **Connection Requests** - Handle new connection applications and approvals
- **Meter Readings** - Record and track utility consumption
- **Billing Cycles** - Configure and manage billing periods
- **Bill Generation** - Automated bill generation based on tariff plans
- **Payment Processing** - Record and track payments
- **Tariff Plans** - Flexible tariff configuration for different utility types
- **Notifications** - System notifications for consumers
- **Reports** - Generate various reports for analytics
- **Multiple Utility Types** - Support for different utility services (electricity, water, gas, etc.)

---

## 🛠️ Tech Stack

### Frontend
- **Angular 21** - Modern web framework
- **Angular Material** - UI component library
- **Chart.js / ng2-charts** - Data visualization
- **RxJS** - Reactive programming
- **ngx-toastr** - Toast notifications

### Backend
- **.NET 9 Web API** - RESTful API framework
- **Entity Framework Core 9** - ORM for database operations
- **SQL Server (LocalDB)** - Database
- **JWT Bearer Authentication** - Secure API authentication
- **Swagger/OpenAPI** - API documentation

### Testing
- **xUnit** - Unit testing framework for .NET

---

## 📁 Folder Structure

```
Complete Code/
│
├── utility_Management_App/          # Angular Frontend Application
│   ├── src/
│   │   ├── app/                     # Application components, services, and modules
│   │   ├── environments/            # Environment configuration files
│   │   ├── index.html               # Main HTML file
│   │   ├── main.ts                  # Application entry point
│   │   └── styles.scss              # Global styles
│   ├── public/                      # Static assets
│   ├── angular.json                 # Angular CLI configuration
│   ├── package.json                 # Node.js dependencies
│   └── tsconfig.json                # TypeScript configuration
│
├── UtilityManagmentApi/             # .NET Backend API
│   ├── Controllers/                 # API Controllers
│   │   ├── AuthController.cs        # Authentication endpoints
│   │   ├── BillsController.cs       # Bill management
│   │   ├── BillingCyclesController.cs
│   │   ├── ConnectionsController.cs
│   │   ├── ConnectionRequestsController.cs
│   │   ├── ConsumersController.cs
│   │   ├── MeterReadingsController.cs
│   │   ├── NotificationsController.cs
│   │   ├── PaymentsController.cs
│   │   ├── ReportsController.cs
│   │   ├── TariffPlansController.cs
│   │   └── UtilityTypesController.cs
│   ├── Data/                        # Database context and seeders
│   ├── DTOs/                        # Data Transfer Objects
│   ├── Entities/                    # Entity models (database tables)
│   ├── Migrations/                  # EF Core database migrations
│   ├── Middleware/                  # Custom middleware (exception handling)
│   ├── Services/                    # Business logic layer
│   │   ├── Implementations/         # Service implementations
│   │   └── Interfaces/              # Service interfaces
│   ├── Properties/                  # Launch settings
│   ├── appsettings.json             # Application configuration
│   └── Program.cs                   # Application entry point
│
└── Test_Cases_All/                  # Unit Tests Project
    └── Unit_Tests/
        ├── Authorization/           # Authentication & Authorization tests
        └── Controllers/             # Controller unit tests
```

---

## 📌 Prerequisites

Before you begin, ensure you have the following installed on your machine:

| Requirement | Version | Download Link |
|-------------|---------|---------------|
| **Node.js** | v18.x or higher | [Download Node.js](https://nodejs.org/) |
| **npm** | v9.x or higher | Comes with Node.js |
| **Angular CLI** | v21.x | `npm install -g @angular/cli` |
| **.NET SDK** | 9.0 | [Download .NET 9](https://dotnet.microsoft.com/download/dotnet/9.0) |
| **SQL Server LocalDB** | Latest | Included with Visual Studio or [Download](https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb) |

---

## 🚀 Setup Instructions

### Step 1: Download the Project

**Option A: Clone the Repository**
```bash
git clone https://github.com/your-username/utility-management-system.git
```

**Option B: Download ZIP**
- Click on the **"Code"** button on the repository page
- Select **"Download ZIP"**
- Extract the downloaded ZIP file to your preferred location

---

### Step 2: Navigate to the Project Folder

Open your terminal/command prompt and navigate to the **Complete Code** folder:

```bash
cd path/to/Complete Code
```

---

### Step 3: Install Frontend Dependencies

Navigate to the Angular frontend folder and install the required Node modules:

```bash
cd utility_Management_App
npm install
```

This will install all the dependencies listed in `package.json`.

---

### Step 4: Setup the Backend Database

Navigate to the .NET API folder and run the Entity Framework migrations to create the database:

```bash
cd ../UtilityManagmentApi
dotnet restore
dotnet ef database update
```

> **Note:** Make sure SQL Server LocalDB is running. The connection string in `appsettings.json` uses `(localdb)\mssqllocaldb` by default.

If you don't have EF Core tools installed globally, install them first:
```bash
dotnet tool install --global dotnet-ef
```

---

### Step 5: Run the Application

You need to run both the frontend and backend simultaneously. Open **two terminal windows**:

**Terminal 1 - Run the Backend API:**
```bash
cd UtilityManagmentApi
dotnet run
```
The API will start at: `http://localhost:5000` (or `https://localhost:5001`)

**Terminal 2 - Run the Frontend:**
```bash
cd utility_Management_App
ng serve
```
The Angular app will start at: `http://localhost:4200`

---

## 🌐 Running the Application

Once both servers are running:

1. Open your browser and navigate to **http://localhost:4200**
2. The Angular frontend will communicate with the .NET API backend
3. You can access the Swagger API documentation at **http://localhost:5000/swagger** (when running in Development mode)

---

## 📚 API Documentation

The API is documented using **Swagger/OpenAPI**. When running the backend in development mode, you can access the interactive API documentation at:

```
http://localhost:5000/swagger
```

### Main API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | Authentication (Login, Register) |
| `/api/consumers` | Consumer management |
| `/api/connections` | Connection management |
| `/api/connection-requests` | New connection requests |
| `/api/meter-readings` | Meter reading records |
| `/api/billing-cycles` | Billing cycle configuration |
| `/api/bills` | Bill generation and management |
| `/api/payments` | Payment processing |
| `/api/tariff-plans` | Tariff plan configuration |
| `/api/utility-types` | Utility type management |
| `/api/notifications` | System notifications |
| `/api/reports` | Reporting endpoints |

---

## 🧪 Running Tests

To run the unit tests for the backend:

```bash
cd Test_Cases_All
dotnet test
```

---

## 📄 License

This project is developed as part of a Capstone project.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

## 👨‍💻 Author

Armaan Pandey
Developed with ❤️ as a Capstone Project

---

**Happy Coding! 🚀**
