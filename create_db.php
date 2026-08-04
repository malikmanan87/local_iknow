<?php
$mysqli = new mysqli("localhost", "root", "");

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// Create Database
$sql = "CREATE DATABASE IF NOT EXISTS iknow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($mysqli->query($sql) === TRUE) {
    echo "Database iknow_db created or exists successfully.
";
} else {
    die("Error creating database: " . $mysqli->error . "
");
}

$mysqli->select_db("iknow_db");

// 1. Modules Table
$tableModules = "CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    description TEXT,
    status ENUM('Active', 'Maintenance', 'Deprecated') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 2. Module Flows Table
$tableFlows = "CREATE TABLE IF NOT EXISTS module_flows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    step_number INT NOT NULL,
    step_title VARCHAR(255) NOT NULL,
    description TEXT,
    image_path VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 3. Module Issues Table
$tableIssues = "CREATE TABLE IF NOT EXISTS module_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    issue_code VARCHAR(50) DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    symptoms TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 4. Troubleshooting Steps Table
$tableTroubleshooting = "CREATE TABLE IF NOT EXISTS troubleshooting_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    step_number INT NOT NULL,
    instruction TEXT NOT NULL,
    image_path VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES module_issues(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 5. Contact Persons Table
$tableContacts = "CREATE TABLE IF NOT EXISTS contact_persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    phone_no VARCHAR(50) DEFAULT NULL,
    department VARCHAR(100) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

$mysqli->query($tableModules);
$mysqli->query($tableFlows);
$mysqli->query($tableIssues);
$mysqli->query($tableTroubleshooting);
$mysqli->query($tableContacts);

echo "All tables created successfully in iknow_db!
";
$mysqli->close();
