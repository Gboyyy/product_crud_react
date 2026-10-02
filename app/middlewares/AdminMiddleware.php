<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class AdminMiddleware
{
    public function handle(Closure $next)
    {
        if (ProductMiddleware::user()['role'] !== 'admin') {
            lava_instance()->api->respond_error('Administrator access is required.', 403);
        }
        return $next();
    }
}
