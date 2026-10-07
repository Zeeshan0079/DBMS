-- ==============================================================================
-- PropertyDesk Seed Data SQL Script
-- Database: smartnest_db
-- ==============================================================================

USE `smartnest_db`;
SET FOREIGN_KEY_CHECKS = 0;

-- Seed data for deposit
TRUNCATE TABLE `deposit`;
INSERT INTO `deposit` (`deposit_id`, `lease_id`, `amount`, `date_paid`, `refund_amount`, `refund_date`) VALUES
(1, 1, 25000.00, '2026-01-01', 0.00, NULL),
(2, 2, 22000.00, '2026-02-01', 0.00, NULL),
(3, 3, 32000.00, '2026-03-01', 0.00, NULL),
(4, 4, 28000.00, '2026-04-15', 0.00, NULL),
(5, 5, 24000.00, '2026-05-01', 0.00, NULL),
(6, 6, 26000.00, '2026-06-01', 0.00, NULL),
(7, 7, 18000.00, '2026-01-15', 0.00, NULL),
(8, 8, 30000.00, '2026-07-01', 0.00, NULL),
(9, 9, 20000.00, '2026-08-01', 0.00, NULL),
(10, 10, 27000.00, '2026-01-01', 0.00, NULL),
(11, 11, 21000.00, '2026-09-01', 0.00, NULL),
(12, 12, 23000.00, '2026-09-15', 0.00, NULL),
(13, 13, 19000.00, '2026-01-01', 0.00, NULL),
(14, 14, 31000.00, '2026-01-01', 0.00, NULL),
(15, 15, 17000.00, '2026-01-01', 0.00, NULL),
(16, 16, 20000.00, '2026-04-01', 0.00, NULL),
(17, 17, 18000.00, '2025-01-01', 16000.00, '2026-01-10'),
(18, 18, 16000.00, '2024-06-01', 15000.00, '2025-06-15');

-- Seed data for inspection
TRUNCATE TABLE `inspection`;
INSERT INTO `inspection` (`inspection_id`, `unit_id`, `inspection_date`, `inspector_name`, `remarks`) VALUES
(1, 1, '2026-08-01', 'Ramesh Kumar', 'Good condition'),
(2, 2, '2026-08-03', 'Ramesh Kumar', 'Minor paint work required'),
(3, 3, '2026-08-05', 'Sanjay Rao', 'Excellent condition'),
(4, 4, '2026-08-07', 'Sanjay Rao', 'Kitchen maintenance required'),
(5, 5, '2026-08-10', 'Meena Shah', 'Good condition'),
(6, 7, '2026-08-12', 'Meena Shah', 'Bathroom inspection completed'),
(7, 9, '2026-08-15', 'Ramesh Kumar', 'No major issues'),
(8, 10, '2026-08-18', 'Sanjay Rao', 'AC servicing required'),
(9, 13, '2026-08-20', 'Meena Shah', 'Good condition'),
(10, 19, '2026-08-22', 'Ramesh Kumar', 'Minor plumbing issue');

-- Seed data for lease
TRUNCATE TABLE `lease`;
INSERT INTO `lease` (`lease_id`, `unit_id`, `tenant_id`, `start_date`, `end_date`, `monthly_rent`, `status`) VALUES
(1, 1, 1, '2026-01-01', '2026-12-31', 25000.00, 'Active'),
(2, 2, 2, '2026-02-01', '2027-01-31', 22000.00, 'Active'),
(3, 3, 3, '2026-03-01', '2027-02-28', 32000.00, 'Active'),
(4, 4, 4, '2026-04-15', '2026-10-15', 28000.00, 'Active'),
(5, 5, 5, '2026-05-01', '2027-04-30', 24000.00, 'Active'),
(6, 6, 6, '2026-06-01', '2027-05-31', 26000.00, 'Active'),
(7, 7, 7, '2026-01-15', '2026-10-05', 18000.00, 'Active'),
(8, 8, 8, '2026-07-01', '2027-06-30', 30000.00, 'Active'),
(9, 9, 9, '2026-08-01', '2027-07-31', 20000.00, 'Active'),
(10, 10, 10, '2026-01-01', '2026-12-31', 27000.00, 'Active'),
(11, 11, 11, '2026-09-01', '2027-08-31', 21000.00, 'Active'),
(12, 12, 12, '2026-09-15', '2027-09-14', 23000.00, 'Active'),
(13, 13, 13, '2026-01-01', '2026-10-20', 19000.00, 'Active'),
(14, 14, 14, '2026-01-01', '2027-03-31', 31000.00, 'Active'),
(15, 15, 15, '2026-01-01', '2026-10-10', 17000.00, 'Active'),
(16, 19, 16, '2026-04-01', '2027-03-31', 20000.00, 'Active'),
(17, 18, 3, '2025-01-01', '2025-12-31', 18000.00, 'Terminated'),
(18, 17, 4, '2024-06-01', '2025-05-31', 16000.00, 'Terminated');

-- Seed data for maintenance_request
TRUNCATE TABLE `maintenance_request`;
INSERT INTO `maintenance_request` (`request_id`, `unit_id`, `tenant_id`, `request_date`, `description`, `status`, `cost`) VALUES
(1, 1, 1, '2026-08-02', 'AC servicing required', 'Completed', 2500.00),
(2, 2, 2, '2026-08-04', 'Bathroom tap leaking', 'Completed', 800.00),
(3, 3, 3, '2026-08-08', 'Kitchen exhaust not working', 'In Progress', 1500.00),
(4, 4, 4, '2026-08-11', 'Bedroom fan making noise', 'Open', 1200.00),
(5, 5, 5, '2026-08-13', 'Water purifier issue', 'Completed', 900.00),
(6, 7, 7, '2026-08-16', 'Door lock replacement', 'Completed', 1800.00),
(7, 9, 9, '2026-08-19', 'Electrical socket issue', 'Open', 700.00),
(8, 10, 10, '2026-08-21', 'AC cooling problem', 'In Progress', 3000.00),
(9, 13, 13, '2026-08-23', 'Kitchen sink leakage', 'Completed', 1100.00),
(10, 19, 16, '2026-08-25', 'Balcony light replacement', 'Open', 600.00);

-- Seed data for owner
TRUNCATE TABLE `owner`;
INSERT INTO `owner` (`owner_id`, `name`, `phone`, `email`, `address`) VALUES
(1, 'Rajesh Kumar', '9876543210', 'rajesh@gmail.com', 'Hyderabad'),
(2, 'Anita Sharma', '9876501234', 'anita@gmail.com', 'Hyderabad'),
(3, 'Vikram Reddy', '9988776655', 'vikram@gmail.com', 'Secunderabad'),
(4, 'Suresh Rao', '9876512345', 'suresh.rao@gmail.com', 'Hyderabad'),
(5, 'Priya Mehta', '9876523456', 'priya.mehta@gmail.com', 'Bangalore'),
(6, 'Arjun Kapoor', '9876534567', 'arjun.kapoor@gmail.com', 'Mumbai'),
(7, 'Neha Verma', '9876545678', 'neha.verma@gmail.com', 'Pune'),
(8, 'Rohit Sharma', '9876556789', 'rohit.sharma@gmail.com', 'Delhi'),
(9, 'Kavya Reddy', '9876567890', 'kavya.reddy@gmail.com', 'Secunderabad'),
(10, 'Amit Patel', '9876578901', 'amit.patel@gmail.com', 'Ahmedabad');

-- Seed data for payment
TRUNCATE TABLE `payment`;
INSERT INTO `payment` (`payment_id`, `schedule_id`, `amount_paid`, `payment_date`, `mode`) VALUES
(1, 1, 25000.00, '2026-09-01', 'UPI'),
(2, 3, 22000.00, '2026-09-01', 'Bank Transfer'),
(3, 5, 32000.00, '2026-09-02', 'UPI'),
(4, 7, 28000.00, '2026-09-02', 'Card'),
(5, 9, 12000.00, '2026-09-03', 'UPI'),
(6, 11, 13000.00, '2026-09-03', 'Bank Transfer'),
(7, 13, 9000.00, '2026-09-04', 'UPI'),
(8, 15, 15000.00, '2026-09-04', 'Card'),
(9, 10, 12000.00, '2026-09-10', 'UPI'),
(10, 12, 13000.00, '2026-09-10', 'Bank Transfer'),
(11, 14, 9000.00, '2026-09-11', 'UPI'),
(12, 16, 15000.00, '2026-09-11', 'Card');

-- Seed data for property
TRUNCATE TABLE `property`;
INSERT INTO `property` (`property_id`, `owner_id`, `address`, `city`, `property_type`) VALUES
(1, 1, '12 Jubilee Hills Road', 'Hyderabad', 'Apartment Complex'),
(2, 1, '18 Banjara Hills Road', 'Hyderabad', 'Residential Building'),
(3, 2, '45 Madhapur Main Road', 'Hyderabad', 'Apartment Complex'),
(4, 2, '21 Kondapur Road', 'Hyderabad', 'Villa'),
(5, 3, '22 Hitech City Road', 'Hyderabad', 'Apartment Complex'),
(6, 3, '7 Gachibowli Road', 'Hyderabad', 'Residential Building'),
(7, 4, '10 Begumpet Road', 'Hyderabad', 'Apartment Complex'),
(8, 4, '31 Somajiguda Road', 'Hyderabad', 'Villa'),
(9, 5, '55 Whitefield Main Road', 'Bangalore', 'Apartment Complex'),
(10, 5, '14 Koramangala Road', 'Bangalore', 'Residential Building'),
(11, 6, '88 Andheri West', 'Mumbai', 'Apartment Complex'),
(12, 7, '19 Koregaon Park Road', 'Pune', 'Apartment Complex'),
(13, 8, '72 Saket Road', 'Delhi', 'Residential Building'),
(14, 9, '9 Tarnaka Road', 'Secunderabad', 'Apartment Complex'),
(15, 10, '25 Satellite Road', 'Ahmedabad', 'Residential Building');

-- Seed data for renewal
TRUNCATE TABLE `renewal`;
INSERT INTO `renewal` (`renewal_id`, `lease_id`, `renewal_date`, `new_end_date`, `new_rent`) VALUES
(1, 1, '2026-08-15', '2027-12-31', 27000.00),
(2, 4, '2026-08-20', '2027-10-15', 30000.00),
(3, 8, '2026-08-22', '2028-06-30', 32000.00),
(4, 13, '2026-08-25', '2027-10-20', 20500.00);

-- Seed data for rent_schedule
TRUNCATE TABLE `rent_schedule`;
INSERT INTO `rent_schedule` (`schedule_id`, `lease_id`, `due_date`, `amount_due`, `status`) VALUES
(1, 1, '2026-09-01', 25000.00, 'Paid'),
(2, 1, '2026-10-01', 25000.00, 'Pending'),
(3, 2, '2026-09-01', 22000.00, 'Paid'),
(4, 2, '2026-10-01', 22000.00, 'Pending'),
(5, 3, '2026-09-01', 32000.00, 'Paid'),
(6, 3, '2026-10-01', 32000.00, 'Pending'),
(7, 4, '2026-09-01', 28000.00, 'Paid'),
(8, 4, '2026-10-01', 28000.00, 'Pending'),
(9, 5, '2026-09-01', 24000.00, 'Partial'),
(10, 5, '2026-10-01', 24000.00, 'Pending'),
(11, 6, '2026-09-01', 26000.00, 'Partial'),
(12, 6, '2026-10-01', 26000.00, 'Pending'),
(13, 7, '2026-09-01', 18000.00, 'Partial'),
(14, 7, '2026-10-01', 18000.00, 'Pending'),
(15, 8, '2026-09-01', 30000.00, 'Partial'),
(16, 8, '2026-10-01', 30000.00, 'Pending'),
(17, 9, '2026-09-01', 20000.00, 'Partial'),
(18, 9, '2026-10-01', 20000.00, 'Pending'),
(19, 10, '2026-09-01', 27000.00, 'Partial'),
(20, 10, '2026-10-01', 27000.00, 'Pending'),
(21, 11, '2026-09-01', 21000.00, 'Pending'),
(22, 11, '2026-10-01', 21000.00, 'Pending'),
(23, 12, '2026-09-01', 23000.00, 'Pending'),
(24, 12, '2026-10-01', 23000.00, 'Pending'),
(25, 13, '2026-09-01', 19000.00, 'Pending'),
(26, 13, '2026-10-01', 19000.00, 'Pending'),
(27, 14, '2026-09-01', 31000.00, 'Pending'),
(28, 14, '2026-10-01', 31000.00, 'Pending'),
(29, 15, '2026-09-01', 17000.00, 'Pending'),
(30, 15, '2026-10-01', 17000.00, 'Pending'),
(31, 16, '2026-09-01', 20000.00, 'Pending'),
(32, 16, '2026-10-01', 20000.00, 'Pending');

-- Seed data for tenant
TRUNCATE TABLE `tenant`;
INSERT INTO `tenant` (`tenant_id`, `name`, `phone`, `email`, `id_proof_no`) VALUES
(1, 'Aarav Mehta', '9000011111', 'aarav@gmail.com', 'AADHAR1001'),
(2, 'Priya Singh', '9000022222', 'priya.singh@gmail.com', 'AADHAR1002'),
(3, 'Rahul Verma', '9000033333', 'rahul.verma@gmail.com', 'AADHAR1003'),
(4, 'Sneha Reddy', '9000044444', 'sneha.reddy@gmail.com', 'AADHAR1004'),
(5, 'Karan Shah', '9000055555', 'karan.shah@gmail.com', 'AADHAR1005'),
(6, 'Riya Kapoor', '9000066666', 'riya.kapoor@gmail.com', 'AADHAR1006'),
(7, 'Aditya Rao', '9000077777', 'aditya.rao@gmail.com', 'AADHAR1007'),
(8, 'Meera Nair', '9000088888', 'meera.nair@gmail.com', 'AADHAR1008'),
(9, 'Varun Malhotra', '9000099999', 'varun.malhotra@gmail.com', 'AADHAR1009'),
(10, 'Ishita Jain', '9000012345', 'ishita.jain@gmail.com', 'AADHAR1010'),
(11, 'Rohan Das', '9000023456', 'rohan.das@gmail.com', 'AADHAR1011'),
(12, 'Pooja Menon', '9000034567', 'pooja.menon@gmail.com', 'AADHAR1012'),
(13, 'Nikhil Gupta', '9000045678', 'nikhil.gupta@gmail.com', 'AADHAR1013'),
(14, 'Ananya Rao', '9000056789', 'ananya.rao@gmail.com', 'AADHAR1014'),
(15, 'Siddharth Bose', '9000067890', 'siddharth.bose@gmail.com', 'AADHAR1015'),
(16, 'Tanya Kapoor', '9000078901', 'tanya.kapoor@gmail.com', 'AADHAR1016'),
(17, 'zeeshan', '8885236266', 'mohdxeeshan1221@gmail.com', '23456789456'),
(20, 'Test Tenant', '9876543210', 'testtenent@gmail.com', 'AADHAR1099');

-- Seed data for termination
TRUNCATE TABLE `termination`;
INSERT INTO `termination` (`termination_id`, `lease_id`, `termination_date`, `reason`) VALUES
(1, 17, '2026-01-10', 'Tenant moved to another city'),
(2, 18, '2025-06-15', 'Lease ended and tenant relocated');

-- Seed data for unit
TRUNCATE TABLE `unit`;
INSERT INTO `unit` (`unit_id`, `property_id`, `unit_no`, `floor`, `bedrooms`, `rent_amount`, `status`) VALUES
(1, 1, 'A-101', 1, 2, 25000.00, 'Occupied'),
(2, 1, 'A-102', 1, 2, 22000.00, 'Occupied'),
(3, 2, 'B-201', 2, 3, 32000.00, 'Occupied'),
(4, 2, 'B-202', 2, 2, 28000.00, 'Occupied'),
(5, 3, 'C-301', 3, 2, 24000.00, 'Occupied'),
(6, 3, 'C-302', 3, 3, 26000.00, 'Occupied'),
(7, 4, 'D-401', 4, 1, 18000.00, 'Occupied'),
(8, 4, 'D-402', 4, 3, 30000.00, 'Occupied'),
(9, 5, 'E-501', 5, 2, 20000.00, 'Occupied'),
(10, 5, 'E-502', 5, 3, 27000.00, 'Occupied'),
(11, 6, 'F-601', 6, 2, 21000.00, 'Occupied'),
(12, 7, 'G-101', 1, 2, 23000.00, 'Occupied'),
(13, 8, 'H-201', 2, 1, 19000.00, 'Occupied'),
(14, 9, 'I-301', 3, 3, 31000.00, 'Occupied'),
(15, 10, 'J-401', 4, 2, 17000.00, 'Occupied'),
(16, 11, 'K-501', 5, 3, 29000.00, 'Available'),
(17, 12, 'L-601', 6, 2, 26000.00, 'Maintenance'),
(18, 13, 'M-101', 1, 2, 24000.00, 'Maintenance'),
(19, 14, 'N-201', 2, 2, 20000.00, 'Occupied'),
(20, 15, 'O-301', 3, 1, 16000.00, 'Available');

SET FOREIGN_KEY_CHECKS = 1;