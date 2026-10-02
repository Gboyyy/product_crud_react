<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class ProductMiddleware
{
    private static $user;

    public static function user(): array
    {
        if (self::$user === null) {
            throw new LogicException('Authentication middleware has not run.');
        }
        return self::$user;
    }

    public function handle(Closure $next)
    {
        self::$user = null;
        // Middleware runs before the destination controller is constructed.
        $app = new Controller();
        $app->call->library('api');
        header('Cache-Control: no-store');
        $token = $app->api->get_bearer_token();
        if (!$token) $app->api->respond_error('Please log in.', 401);
        $app->call->database();
        $session = $app->db->table('refresh_tokens')
            ->where('token', hash('sha256', $token))
            ->where('expires_at', '>', date('Y-m-d H:i:s'))
            ->limit(1)->get();
        $user = $session ? $app->db->table('users')
            ->select('id,username,email,role')->where('id', $session['user_id'])
            ->where('is_active', 1)->get() : false;
        if (!$user) $app->api->respond_error('Session expired. Please log in again.', 401);
        self::$user = $user;
        try {
            return $next();
        } finally {
            self::$user = null;
        }
    }
}
