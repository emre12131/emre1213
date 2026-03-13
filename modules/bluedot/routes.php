<?php

defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Bluedot module routes
 *
 * The webhook endpoint must be accessible WITHOUT admin authentication.
 * All other routes go through the standard admin controller.
 */
$route['bluedot/webhook/receive'] = 'bluedot/webhook/receive';
$route['bluedot/webhook/receive/(:any)'] = 'bluedot/webhook/receive/$1';
