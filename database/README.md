# PropertyDesk MySQL Database Setup

This directory contains the database setup and seed data scripts for **smartnest_db**.

## Database Files

1. **`schema.sql`**: Full MySQL database schema definition, including all tables, primary keys, foreign key constraints, triggers, stored procedures (`create_lease`), and database views.
2. **`seed_data.sql`**: Initial seed data populated for testing properties, units, tenants, leases, rent schedules, and maintenance requests.

## How to Setup in MySQL / MySQL Workbench

### Method 1: Using MySQL Workbench
1. Open **MySQL Workbench** and connect to your MySQL Server (`127.0.0.1:3306`).
2. Go to **File -> Open SQL Script...** and select `database/schema.sql`.
3. Click the **Lightning Bolt** button to execute the schema setup script.
4. Next, open `database/seed_data.sql` and execute it to load sample data.

### Method 2: Using MySQL Command Line
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p smartnest_db < database/seed_data.sql
```
