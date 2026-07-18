<?php
echo "PHP version: " . phpversion() . "<br>";
echo "Architecture: " . (PHP_INT_SIZE === 8 ? "x64" : "x86") . "<br><br>";
echo "Available PDO drivers:<br>";
print_r(PDO::getAvailableDrivers());