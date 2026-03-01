<?php

defined('BASEPATH') or exit('No direct script access allowed');

$CI = &get_instance();

// Drop the meetings table
if ($CI->db->table_exists(db_prefix() . 'bluedot_meetings')) {
    $CI->db->query('DROP TABLE `' . db_prefix() . 'bluedot_meetings`');
}

// Remove all module options
$option_keys = [
    'bluedot_webhook_secret',
    'bluedot_create_notes',
    'bluedot_create_activities',
    'bluedot_note_prefix',
    'bluedot_match_by_email',
    'bluedot_default_activity_type',
    'bluedot_include_transcript',
    'bluedot_include_action_items',
    'bluedot_notify_staff',
    'bluedot_notify_staff_id',
];

foreach ($option_keys as $key) {
    $CI->db->where('name', $key)->delete(db_prefix() . 'options');
}

// Remove module permissions
$CI->db->where('name', 'bluedot')->delete(db_prefix() . 'permissions');
