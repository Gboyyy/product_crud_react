<?php
class Create_products_table {
 private $_lava;
 public function __construct() { $this->_lava=lava_instance(); $this->_lava->call->database(); }
 public function up() { $this->_lava->db->raw('CREATE TABLE IF NOT EXISTS products (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, product_name VARCHAR(100) NOT NULL, description TEXT NOT NULL, price DECIMAL(10,2) NOT NULL, quantity INT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'); }
 public function down() { $this->_lava->db->raw('DROP TABLE IF EXISTS products'); }
}
