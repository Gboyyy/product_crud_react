<?php
// Preserve rows from the older laboratory schema already present locally.
class Align_legacy_schema {
 private $_lava;
 public function __construct() { $this->_lava=lava_instance(); $this->_lava->call->database(); }
 public function up() {
  $db=$this->_lava->db;
  $columns=array_column($db->raw('SHOW COLUMNS FROM users')->fetchAll(),'Field');
  foreach (['email'=>'VARCHAR(255) NULL','role'=>"VARCHAR(20) NOT NULL DEFAULT 'user'",'is_active'=>'TINYINT NOT NULL DEFAULT 1','created_at'=>'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP','updated_at'=>'DATETIME NULL'] as $name=>$definition) {
   if (!in_array($name,$columns,true)) $db->raw("ALTER TABLE users ADD COLUMN $name $definition");
  }
  $db->raw('ALTER TABLE users MODIFY password VARCHAR(255) NOT NULL');
  // Legacy role_id is not used by token authentication.
  if (in_array('role_id',$columns,true)) $db->raw('ALTER TABLE users MODIFY role_id INT NULL');
  $db->raw('ALTER TABLE users ENGINE=InnoDB');
  $indexes=array_column($db->raw('SHOW INDEX FROM users')->fetchAll(),'Key_name');
  if (!in_array('lab6_username_unique',$indexes,true) && !in_array('username_unique',$indexes,true)) $db->raw('ALTER TABLE users ADD UNIQUE KEY lab6_username_unique (username)');
  if (!in_array('lab6_email_unique',$indexes,true)) $db->raw('ALTER TABLE users ADD UNIQUE KEY lab6_email_unique (email)');
  $db->raw('ALTER TABLE products MODIFY price DECIMAL(10,2) NOT NULL');
 }
 public function down() {
  // Keep compatibility fields and existing data; reverting would lose account data.
 }
}
