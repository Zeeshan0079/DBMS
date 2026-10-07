-- ==============================================================================
-- PropertyDesk SaaS Database Schema & Setup Script
-- Database: smartnest_db
-- Target: MySQL 8.0+ / MariaDB
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS smartnest_db;
USE smartnest_db;

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS deposit;
CREATE TABLE `deposit` (
  `deposit_id` int NOT NULL AUTO_INCREMENT,
  `lease_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date_paid` date DEFAULT NULL,
  `refund_amount` decimal(10,2) DEFAULT '0.00',
  `refund_date` date DEFAULT NULL,
  PRIMARY KEY (`deposit_id`),
  UNIQUE KEY `lease_id` (`lease_id`),
  CONSTRAINT `fk_deposit_lease` FOREIGN KEY (`lease_id`) REFERENCES `lease` (`lease_id`),
  CONSTRAINT `chk_deposit_amount` CHECK ((`amount` >= 0)),
  CONSTRAINT `chk_refund_amount` CHECK ((`refund_amount` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS inspection;
CREATE TABLE `inspection` (
  `inspection_id` int NOT NULL AUTO_INCREMENT,
  `unit_id` int NOT NULL,
  `inspection_date` date NOT NULL,
  `inspector_name` varchar(100) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`inspection_id`),
  KEY `fk_inspection_unit` (`unit_id`),
  CONSTRAINT `fk_inspection_unit` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`unit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS lease;
CREATE TABLE `lease` (
  `lease_id` int NOT NULL AUTO_INCREMENT,
  `unit_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `monthly_rent` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`lease_id`),
  KEY `fk_lease_unit` (`unit_id`),
  KEY `fk_lease_tenant` (`tenant_id`),
  KEY `idx_lease_end_date` (`end_date`),
  CONSTRAINT `fk_lease_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`tenant_id`),
  CONSTRAINT `fk_lease_unit` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`unit_id`),
  CONSTRAINT `chk_lease_dates` CHECK ((`end_date` > `start_date`)),
  CONSTRAINT `chk_lease_rent` CHECK ((`monthly_rent` >= 0)),
  CONSTRAINT `chk_lease_status` CHECK ((`status` in (_utf8mb4'Active',_utf8mb4'Expired',_utf8mb4'Terminated')))
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS maintenance_request;
CREATE TABLE `maintenance_request` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `unit_id` int NOT NULL,
  `tenant_id` int NOT NULL,
  `request_date` date NOT NULL,
  `description` varchar(500) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Open',
  `cost` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`request_id`),
  KEY `fk_maintenance_unit` (`unit_id`),
  KEY `fk_maintenance_tenant` (`tenant_id`),
  KEY `idx_maintenance_status` (`status`),
  CONSTRAINT `fk_maintenance_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`tenant_id`),
  CONSTRAINT `fk_maintenance_unit` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`unit_id`),
  CONSTRAINT `chk_maintenance_cost` CHECK ((`cost` >= 0)),
  CONSTRAINT `chk_maintenance_status` CHECK ((`status` in (_utf8mb4'Open',_utf8mb4'In Progress',_utf8mb4'Completed')))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS owner;
CREATE TABLE `owner` (
  `owner_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`owner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS payment;
CREATE TABLE `payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `mode` varchar(20) NOT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `fk_payment_schedule` (`schedule_id`),
  CONSTRAINT `fk_payment_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `rent_schedule` (`schedule_id`),
  CONSTRAINT `chk_payment_amount` CHECK ((`amount_paid` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS property;
CREATE TABLE `property` (
  `property_id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `address` varchar(200) NOT NULL,
  `city` varchar(50) NOT NULL,
  `property_type` varchar(50) NOT NULL,
  PRIMARY KEY (`property_id`),
  KEY `fk_property_owner` (`owner_id`),
  KEY `idx_property_city` (`city`),
  CONSTRAINT `fk_property_owner` FOREIGN KEY (`owner_id`) REFERENCES `owner` (`owner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS renewal;
CREATE TABLE `renewal` (
  `renewal_id` int NOT NULL AUTO_INCREMENT,
  `lease_id` int NOT NULL,
  `renewal_date` date NOT NULL,
  `new_end_date` date NOT NULL,
  `new_rent` decimal(10,2) NOT NULL,
  PRIMARY KEY (`renewal_id`),
  KEY `fk_renewal_lease` (`lease_id`),
  CONSTRAINT `fk_renewal_lease` FOREIGN KEY (`lease_id`) REFERENCES `lease` (`lease_id`),
  CONSTRAINT `chk_renewal_rent` CHECK ((`new_rent` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS rent_schedule;
CREATE TABLE `rent_schedule` (
  `schedule_id` int NOT NULL AUTO_INCREMENT,
  `lease_id` int NOT NULL,
  `due_date` date NOT NULL,
  `amount_due` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (`schedule_id`),
  KEY `fk_schedule_lease` (`lease_id`),
  KEY `idx_rent_due_date` (`due_date`),
  CONSTRAINT `fk_schedule_lease` FOREIGN KEY (`lease_id`) REFERENCES `lease` (`lease_id`),
  CONSTRAINT `chk_rent_amount` CHECK ((`amount_due` >= 0)),
  CONSTRAINT `chk_rent_schedule_status` CHECK ((`status` in (_utf8mb4'Pending',_utf8mb4'Paid',_utf8mb4'Partial')))
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS tenant;
CREATE TABLE `tenant` (
  `tenant_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `id_proof_no` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS termination;
CREATE TABLE `termination` (
  `termination_id` int NOT NULL AUTO_INCREMENT,
  `lease_id` int NOT NULL,
  `termination_date` date NOT NULL,
  `reason` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`termination_id`),
  UNIQUE KEY `lease_id` (`lease_id`),
  CONSTRAINT `fk_termination_lease` FOREIGN KEY (`lease_id`) REFERENCES `lease` (`lease_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS unit;
CREATE TABLE `unit` (
  `unit_id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `unit_no` varchar(20) NOT NULL,
  `floor` int DEFAULT NULL,
  `bedrooms` int DEFAULT NULL,
  `rent_amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Available',
  PRIMARY KEY (`unit_id`),
  KEY `fk_unit_property` (`property_id`),
  KEY `idx_unit_status` (`status`),
  CONSTRAINT `fk_unit_property` FOREIGN KEY (`property_id`) REFERENCES `property` (`property_id`),
  CONSTRAINT `chk_unit_rent` CHECK ((`rent_amount` >= 0)),
  CONSTRAINT `chk_unit_status` CHECK ((`status` in (_utf8mb4'Available',_utf8mb4'Occupied',_utf8mb4'Maintenance')))
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- STORED PROCEDURES
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS create_lease;
DELIMITER //
CREATE DEFINER=`root`@`localhost` PROCEDURE `create_lease`(
    IN p_unit_id INT,
    IN p_tenant_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_monthly_rent DECIMAL(10,2)
)
BEGIN

    DECLARE v_count INT DEFAULT 0;

    /* Check date validity */

    IF p_end_date <= p_start_date THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Lease end date must be after start date';

    END IF;


    /* Check for overlapping active leases */

    SELECT COUNT(*)
    INTO v_count
    FROM lease
    WHERE unit_id = p_unit_id
      AND status = 'Active'
      AND p_start_date <= end_date
      AND p_end_date >= start_date;


    IF v_count > 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Overlapping active lease exists for this unit';

    END IF;


    /* Create lease */

    INSERT INTO lease
    (
        unit_id,
        tenant_id,
        start_date,
        end_date,
        monthly_rent,
        status
    )
    VALUES
    (
        p_unit_id,
        p_tenant_id,
        p_start_date,
        p_end_date,
        p_monthly_rent,
        'Active'
    );

END //
DELIMITER ;

-- -----------------------------------------------------------------------------
-- TRIGGERS
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_lease_before_insert;
DELIMITER //
CREATE DEFINER=`root`@`localhost` TRIGGER `trg_lease_before_insert` BEFORE INSERT ON `lease` FOR EACH ROW BEGIN

    IF NEW.status = 'Active' THEN

        IF (
            SELECT status
            FROM unit
            WHERE unit_id = NEW.unit_id
        ) <> 'Available' THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'Only available units can be leased';

        END IF;

    END IF;

END //
DELIMITER ;

DROP TRIGGER IF EXISTS trg_lease_after_insert;
DELIMITER //
CREATE DEFINER=`root`@`localhost` TRIGGER `trg_lease_after_insert` AFTER INSERT ON `lease` FOR EACH ROW BEGIN

    IF NEW.status = 'Active' THEN

        UPDATE unit
        SET status = 'Occupied'
        WHERE unit_id = NEW.unit_id;

    END IF;

END //
DELIMITER ;

DROP TRIGGER IF EXISTS trg_lease_before_update;
DELIMITER //
CREATE DEFINER=`root`@`localhost` TRIGGER `trg_lease_before_update` BEFORE UPDATE ON `lease` FOR EACH ROW BEGIN

    IF NEW.status = 'Active'
       AND (OLD.status <> 'Active'
            OR OLD.unit_id <> NEW.unit_id) THEN

        IF (
            SELECT status
            FROM unit
            WHERE unit_id = NEW.unit_id
        ) <> 'Available' THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
            'Only available units can be leased';

        END IF;

    END IF;

END //
DELIMITER ;

DROP TRIGGER IF EXISTS trg_lease_after_update;
DELIMITER //
CREATE DEFINER=`root`@`localhost` TRIGGER `trg_lease_after_update` AFTER UPDATE ON `lease` FOR EACH ROW BEGIN

    IF OLD.status = 'Active'
       AND (NEW.status <> 'Active'
            OR OLD.unit_id <> NEW.unit_id) THEN

        UPDATE unit
        SET status = 'Available'
        WHERE unit_id = OLD.unit_id;

    END IF;


    IF NEW.status = 'Active' THEN

        UPDATE unit
        SET status = 'Occupied'
        WHERE unit_id = NEW.unit_id;

    END IF;

END //
DELIMITER ;

DROP TRIGGER IF EXISTS trg_payment_before_insert;
DELIMITER //
CREATE DEFINER=`root`@`localhost` TRIGGER `trg_payment_before_insert` BEFORE INSERT ON `payment` FOR EACH ROW BEGIN

    IF NEW.amount_paid >
       (
           SELECT amount_due
           FROM rent_schedule
           WHERE schedule_id = NEW.schedule_id
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Payment cannot exceed the amount due';

    END IF;

END //
DELIMITER ;

DROP TRIGGER IF EXISTS trg_payment_before_update;
DELIMITER //
CREATE DEFINER=`root`@`localhost` TRIGGER `trg_payment_before_update` BEFORE UPDATE ON `payment` FOR EACH ROW BEGIN

    IF NEW.amount_paid >
       (
           SELECT amount_due
           FROM rent_schedule
           WHERE schedule_id = NEW.schedule_id
       ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Payment cannot exceed the amount due';

    END IF;

END //
DELIMITER ;

-- -----------------------------------------------------------------------------
-- VIEWS
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS due_rent;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `due_rent` AS select `rs`.`schedule_id` AS `schedule_id`,`t`.`name` AS `tenant_name`,`rs`.`due_date` AS `due_date`,`rs`.`amount_due` AS `amount_due`,`rs`.`status` AS `status` from ((`rent_schedule` `rs` join `lease` `l` on((`rs`.`lease_id` = `l`.`lease_id`))) join `tenant` `t` on((`l`.`tenant_id` = `t`.`tenant_id`))) where (`rs`.`status` <> 'Paid');

DROP VIEW IF EXISTS lease_expiry_report;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `lease_expiry_report` AS select `l`.`lease_id` AS `lease_id`,`t`.`name` AS `tenant_name`,`u`.`unit_no` AS `unit_no`,`l`.`start_date` AS `start_date`,`l`.`end_date` AS `end_date`,`l`.`monthly_rent` AS `monthly_rent` from ((`lease` `l` join `tenant` `t` on((`l`.`tenant_id` = `t`.`tenant_id`))) join `unit` `u` on((`l`.`unit_id` = `u`.`unit_id`))) where ((`l`.`status` = 'Active') and (`l`.`end_date` <= (curdate() + interval 30 day)));

DROP VIEW IF EXISTS owner_income;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `owner_income` AS select `o`.`owner_id` AS `owner_id`,`o`.`name` AS `owner_name`,coalesce(sum(`pay`.`amount_paid`),0) AS `total_income` from (((((`owner` `o` left join `property` `p` on((`o`.`owner_id` = `p`.`owner_id`))) left join `unit` `u` on((`p`.`property_id` = `u`.`property_id`))) left join `lease` `l` on((`u`.`unit_id` = `l`.`unit_id`))) left join `rent_schedule` `rs` on((`l`.`lease_id` = `rs`.`lease_id`))) left join `payment` `pay` on((`rs`.`schedule_id` = `pay`.`schedule_id`))) group by `o`.`owner_id`,`o`.`name`;

DROP VIEW IF EXISTS tenant_history;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `tenant_history` AS select `t`.`tenant_id` AS `tenant_id`,`t`.`name` AS `tenant_name`,`p`.`address` AS `address`,`u`.`unit_no` AS `unit_no`,`l`.`start_date` AS `start_date`,`l`.`end_date` AS `end_date`,`l`.`monthly_rent` AS `monthly_rent`,`l`.`status` AS `status` from (((`tenant` `t` join `lease` `l` on((`t`.`tenant_id` = `l`.`tenant_id`))) join `unit` `u` on((`l`.`unit_id` = `u`.`unit_id`))) join `property` `p` on((`u`.`property_id` = `p`.`property_id`)));

DROP VIEW IF EXISTS vacant_units;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vacant_units` AS select `u`.`unit_id` AS `unit_id`,`p`.`address` AS `address`,`p`.`city` AS `city`,`u`.`unit_no` AS `unit_no`,`u`.`floor` AS `floor`,`u`.`bedrooms` AS `bedrooms`,`u`.`rent_amount` AS `rent_amount` from (`unit` `u` join `property` `p` on((`u`.`property_id` = `p`.`property_id`))) where (`u`.`status` = 'Available');
