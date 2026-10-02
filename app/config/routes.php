<?php
 defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');
load_class('config', 'kernel')->load('middleware');
// OPTIONS requests are handled by the router before controllers load API config.
load_class('config', 'kernel')->load('api');
$router->get('/', 'Productcontroller::health');
$router->get('api/health', 'Productcontroller::health');
// Compatibility with the API tester's authentication paths.
$router->post('api/create','Productcontroller::register');
$router->post('api/login','Productcontroller::login');
$router->post('api/logout','Productcontroller::logout')->middleware('auth');
$router->get('api/me','Productcontroller::me')->middleware('auth');
$router->get('api/profile','Productcontroller::me')->middleware('auth');
foreach (['register','login','logout'] as $action) {
 $router->post('api/auth/'.$action,'Productcontroller::'.$action);
 if ($action==='logout') $router->middleware('auth');
 $router->options('api/auth/'.$action,'Productcontroller::preflight');
}
$router->get('api/auth/me','Productcontroller::me')->middleware('auth');
$router->options('api/auth/me','Productcontroller::preflight');
$router->get('api/products','Productcontroller::index')->middleware('auth');
$router->post('api/products','Productcontroller::create')->middleware(['auth','admin']);
$router->options('api/products','Productcontroller::preflight');
$router->get('api/products/{id}','Productcontroller::show')->middleware('auth');
$router->put('api/products/{id}','Productcontroller::update')->middleware(['auth','admin']);
$router->patch('api/products/{id}','Productcontroller::update')->middleware(['auth','admin']);
$router->delete('api/products/{id}','Productcontroller::delete')->middleware(['auth','admin']);
$router->options('api/products/{id}','Productcontroller::preflight');
if (PHP_SAPI==='cli') {
 $router->get('create-migration/{migration_class}','MigrationController::create_migration');
 foreach (['migrate','rollback','rollback-all','refresh','status'] as $action) $router->get($action,'MigrationController::'.str_replace('-','_',$action));
}
