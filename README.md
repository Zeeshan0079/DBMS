# PropertyDesk — Enterprise Property Rental & Lease Management System

A full-stack SaaS dashboard for managing rental properties, units, tenants, leases, payments, maintenance requests, and analytics reports. Built with **Python Flask** (backend) and **Vanilla HTML/CSS/JS** (frontend), connected to a **MySQL** database (`smartnest_db`).

---

## Project Structure

```
DBMS1/
├── app.py                  # Root entry point — starts the Flask server
├── backend/
│   ├── app.py              # Flask REST API routes
│   └── db.py               # MySQL connection & all CRUD/query functions
├── frontend/
│   ├── templates/
│   │   └── index.html      # Single-page application UI
│   └── static/
│       ├── css/style.css   # Application stylesheet
│       ├── js/app.js       # Frontend logic (API calls, DOM rendering)
│       └── propertydesk_logo.png
├── database/
│   ├── schema.sql          # Full MySQL DDL (tables, constraints, triggers, procedures, views)
│   ├── seed_data.sql       # Sample data for development & demo
│   └── README.md           # Database setup instructions
└── docs/                   # Project documentation & instructions
```

---

## Tech Stack

| Layer     | Technology                       |
|-----------|----------------------------------|
| Backend   | Python 3.13, Flask               |
| Frontend  | HTML5, Vanilla CSS, JavaScript   |
| Database  | MySQL 8.0 (`smartnest_db`)       |

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Zeeshan0079/DBMS.git
cd DBMS
```

### 2. Install Python Dependencies
```bash
pip install flask mysql-connector-python
```

### 3. Set Up the Database
See [`database/README.md`](database/README.md) for full instructions.  
In short:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p smartnest_db < database/seed_data.sql
```

### 4. Configure Database Credentials
Edit `backend/db.py` and update:
```python
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'your_mysql_user',
    'password': 'your_mysql_password',
    'database': 'smartnest_db',
}
```

### 5. Run the Application
```bash
python app.py
```
Open your browser at: **http://127.0.0.1:5000**

---

## Modules

| Module          | Features                                                     |
|-----------------|--------------------------------------------------------------|
| Dashboard       | Real-time metrics, occupancy overview, recent activity       |
| Properties      | Add, view, delete properties with filtering                  |
| Units           | Manage units with status tracking (Available/Occupied/Maintenance) |
| Tenants         | Tenant records with lease history                            |
| Leases          | Create leases via stored procedure, lifecycle management     |
| Rent & Payments | Rent schedules with payment tracking                         |
| Maintenance     | Service request tracking with status updates                 |
| Reports         | 5 database-view-powered reports (Vacant, Due Rent, Expiry, Income, History) |
