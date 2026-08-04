<?php
$mysqli = new mysqli("localhost", "root", "", "iknow_db");

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// 1. Create submodules table
$sqlTable = "CREATE TABLE IF NOT EXISTS submodules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

$mysqli->query($sqlTable);

// 2. Add submodule_id column to module_flows if not exists
$checkFlowCol = $mysqli->query("SHOW COLUMNS FROM module_flows LIKE 'submodule_id'");
if ($checkFlowCol->num_rows == 0) {
    $mysqli->query("ALTER TABLE module_flows ADD COLUMN submodule_id INT DEFAULT NULL AFTER module_id, ADD FOREIGN KEY (submodule_id) REFERENCES submodules(id) ON DELETE SET NULL");
}

// 3. Add submodule_id column to module_issues if not exists
$checkIssueCol = $mysqli->query("SHOW COLUMNS FROM module_issues LIKE 'submodule_id'");
if ($checkIssueCol->num_rows == 0) {
    $mysqli->query("ALTER TABLE module_issues ADD COLUMN submodule_id INT DEFAULT NULL AFTER module_id, ADD FOREIGN KEY (submodule_id) REFERENCES submodules(id) ON DELETE SET NULL");
}

// 4. Add submodule_id column to contact_persons if not exists
$checkContactCol = $mysqli->query("SHOW COLUMNS FROM contact_persons LIKE 'submodule_id'");
if ($checkContactCol->num_rows == 0) {
    $mysqli->query("ALTER TABLE contact_persons ADD COLUMN submodule_id INT DEFAULT NULL AFTER module_id, ADD FOREIGN KEY (submodule_id) REFERENCES submodules(id) ON DELETE SET NULL");
}

echo "Submodules migration completed successfully!
";
$mysqli->close();
