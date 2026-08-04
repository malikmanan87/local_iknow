<?php
$mysqli = new mysqli("localhost", "root", "", "iknow_db");

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// Add parent_id column if not exists
$checkParentCol = $mysqli->query("SHOW COLUMNS FROM submodules LIKE 'parent_id'");
if ($checkParentCol->num_rows == 0) {
    $mysqli->query("ALTER TABLE submodules ADD COLUMN parent_id INT DEFAULT NULL AFTER module_id, ADD FOREIGN KEY (parent_id) REFERENCES submodules(id) ON DELETE CASCADE");
}

echo "Submodules parent_id migration completed successfully!
";
$mysqli->close();
