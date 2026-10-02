<?php
 defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');
class Productcontroller extends Controller {
 public function __construct() { parent::__construct(); $this->call->library('api'); header('Cache-Control: no-store'); header('Content-Type: application/json; charset=utf-8'); }
 public function preflight() { http_response_code(204); }
 public function health() { $this->api->respond(['status'=>'ok']); }
 private function input(): array {
  if (!empty($_POST)) return $_POST;
  $data=json_decode(file_get_contents('php://input'),true);
  if (!is_array($data)) $this->api->respond_error('A JSON object is required.',400);
  return $data;
 }
 public function register() {
  $this->api->rate_limit(null,10,60); $data=$this->input();
  $name=trim((string)($data['username']??'')); $email=trim((string)($data['email']??'')); $password=(string)($data['password']??'');
  if (!preg_match('/^[a-zA-Z0-9_]{3,50}$/',$name)) $this->api->respond_error('Username must be 3-50 letters, numbers or underscores.',422);
  if (!filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($email)>255) $this->api->respond_error('Enter a valid email.',422);
  if (strlen($password)<8 || strlen($password)>72) $this->api->respond_error('Password must be 8-72 bytes.',422);
  $role=(string)($data['role']??'user');
  if (!in_array($role,['user','admin'],true)) $this->api->respond_error('Choose User or Admin.',422);
  $this->call->database();
  try { $this->db->table('users')->insert(['username'=>$name,'email'=>$email,'password'=>password_hash($password,PASSWORD_BCRYPT),'role'=>$role]); }
  catch (PDOException $e) { $cause=$e->getPrevious() ?: $e; if ($cause->getCode()==='23000' || strpos($e->getMessage(),'SQLSTATE[23000]')!==false) $this->api->respond_error('Username or email already exists.',409); throw $e; }
  $this->api->respond(['message'=>'Account created. You can now log in.'],201);
 }
 public function login() {
  $this->api->rate_limit(null,10,60); $data=$this->input(); $this->call->database();
  $user=$this->db->table('users')->where('username',trim((string)($data['username']??'')))->limit(1)->get();
  if (!$user || !$user['is_active'] || !password_verify((string)($data['password']??''),$user['password'])) $this->api->respond_error('Invalid username or password.',401);
  $token=bin2hex(random_bytes(32));
  $this->db->table('refresh_tokens')->where('expires_at','<=',date('Y-m-d H:i:s'))->delete();
  $this->db->table('refresh_tokens')->insert(['user_id'=>$user['id'],'token'=>hash('sha256',$token),'expires_at'=>date('Y-m-d H:i:s',time()+86400),'jti'=>bin2hex(random_bytes(16))]);
  $this->api->respond(['access_token'=>$token,'expires_in'=>86400,'user'=>['id'=>$user['id'],'username'=>$user['username'],'email'=>$user['email'],'role'=>$user['role']]]);
 }
 public function me() { $this->api->respond(ProductMiddleware::user()); }
 public function logout() { $this->call->database(); $this->db->table('refresh_tokens')->where('token',hash('sha256',$this->api->get_bearer_token()))->delete(); $this->api->respond(['message'=>'Logged out.']); }
 public function index() { $this->call->database(); $this->api->respond($this->db->table('products')->order_by('id','DESC')->get_all()); }
 private function product($id): array {
  if (!ctype_digit((string)$id) || (int)$id<1) $this->api->respond_error('Product not found.',404);
  $product=$this->db->table('products')->where('id',$id)->get();
  if (!$product) $this->api->respond_error('Product not found.',404);
  return $product;
 }
 public function show($id) { $this->call->database(); $this->api->respond($this->product($id)); }
 private function validate(array $data): array {
  $name=trim((string)($data['product_name']??'')); $description=(string)($data['description']??''); $price=(string)($data['price']??''); $quantity=(string)($data['quantity']??'');
  if ($name==='' || strlen($name)>100) $this->api->respond_error('Product name is required (maximum 100 bytes).',422);
  if (strlen($description)>65535) $this->api->respond_error('Description is too long.',422);
  if (!preg_match('/^\d{1,8}(\.\d{1,2})?$/',$price)) $this->api->respond_error('Enter a price from 0 to 99999999.99 with at most two decimal places.',422);
  if (!ctype_digit($quantity) || (float)$quantity>2147483647) $this->api->respond_error('Quantity must be a non-negative whole number.',422);
  return ['product_name'=>$name,'description'=>$description,'price'=>$price,'quantity'=>(int)$quantity];
 }
 public function create() {
  $this->call->database(); $data=$this->validate($this->input());
  $this->db->table('products')->insert($data);
  $id=$this->db->last_id(); $this->api->respond($this->product($id),201);
 }
 public function update($id) {
  $this->call->database(); $product=$this->product($id); $input=$this->input();
  if ($_SERVER['REQUEST_METHOD']==='PATCH') $input=array_merge($product,$input);
  $data=$this->validate($input);
  $this->db->table('products')->where('id',$id)->update($data); $this->api->respond($this->product($id));
 }
 public function delete($id) { $this->call->database(); $this->product($id); $this->db->table('products')->where('id',$id)->delete(); $this->api->respond(['message'=>'Product deleted.']); }
}
