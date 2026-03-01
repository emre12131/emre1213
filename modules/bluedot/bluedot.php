<?php

defined('BASEPATH') or exit('No direct script access allowed');

/*
Module Name: Bluedot HQ Integration
Description: Integrates Bluedot HQ AI meeting recorder with Perfex CRM. Automatically creates notes and activities from Bluedot meeting summaries via webhooks.
Version: 1.0.0
Requires at least: 2.3.*
*/

define('BLUEDOT_MODULE_NAME', 'bluedot');
define('BLUEDOT_MODULE_VERSION', '1.0.0');

hooks()->add_action('app_admin_menu', 'bluedot_admin_menu', 50);
hooks()->add_action('module_bluedot_action_links', 'bluedot_action_links');

/**
 * Register admin menu item under Utilities
 */
function bluedot_admin_menu()
{
    if (has_permission('bluedot', '', 'view') || is_admin()) {
        $CI = &get_instance();
        echo '<li class="' . ($CI->uri->segment(1) == 'bluedot' ? 'active' : '') . '">';
        echo '<a href="' . admin_url('bluedot') . '">';
        echo '<i class="fa fa-dot-circle-o menu-icon"></i> ';
        echo _l('bluedot_menu_title');
        echo '</a>';
        echo '</li>';
    }
}

/**
 * Module action links (shown on module list page)
 */
function bluedot_action_links($links)
{
    $links[] = '<a href="' . admin_url('bluedot/settings') . '">' . _l('settings') . '</a>';
    return $links;
}
