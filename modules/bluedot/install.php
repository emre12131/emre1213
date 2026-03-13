<?php

defined('BASEPATH') or exit('No direct script access allowed');

$CI = &get_instance();

// Create bluedot_meetings table to store processed meeting records
if (!$CI->db->table_exists(db_prefix() . 'bluedot_meetings')) {
    $CI->db->query('
        CREATE TABLE IF NOT EXISTS `' . db_prefix() . 'bluedot_meetings` (
            `id`               INT(11) NOT NULL AUTO_INCREMENT,
            `bluedot_id`       VARCHAR(255) NOT NULL,
            `title`            VARCHAR(500) NOT NULL,
            `meeting_date`     DATETIME NOT NULL,
            `platform`         VARCHAR(100) DEFAULT NULL,
            `meeting_url`      TEXT DEFAULT NULL,
            `recording_url`    TEXT DEFAULT NULL,
            `summary`          LONGTEXT DEFAULT NULL,
            `transcript`       LONGTEXT DEFAULT NULL,
            `action_items`     LONGTEXT DEFAULT NULL,
            `participants`     LONGTEXT DEFAULT NULL,
            `duration`         INT(11) DEFAULT NULL COMMENT "Duration in seconds",
            `note_id`          INT(11) DEFAULT NULL COMMENT "Linked Perfex note ID",
            `activity_id`      INT(11) DEFAULT NULL COMMENT "Linked Perfex activity ID",
            `contact_id`       INT(11) DEFAULT NULL COMMENT "Matched Perfex contact ID",
            `customer_id`      INT(11) DEFAULT NULL COMMENT "Matched Perfex customer ID",
            `raw_payload`      LONGTEXT DEFAULT NULL,
            `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `bluedot_id` (`bluedot_id`),
            KEY `contact_id` (`contact_id`),
            KEY `customer_id` (`customer_id`),
            KEY `meeting_date` (`meeting_date`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ');
}

// Set default module options
$defaults = [
    'bluedot_webhook_secret'       => '',
    'bluedot_create_notes'         => 1,
    'bluedot_create_activities'    => 1,
    'bluedot_note_prefix'          => '[Bluedot] ',
    'bluedot_match_by_email'       => 1,
    'bluedot_default_activity_type'=> 9, // "Call" activity type in Perfex
    'bluedot_include_transcript'   => 0,
    'bluedot_include_action_items' => 1,
    'bluedot_notify_staff'         => 0,
    'bluedot_notify_staff_id'      => '',
];

foreach ($defaults as $key => $value) {
    if (get_option($key) === '') {
        add_option($key, $value);
    }
}

// Add module permissions
$permissions = [
    ['name' => 'bluedot', 'short_name' => 'Bluedot'],
];

foreach ($permissions as $perm) {
    $exists = $CI->db->where('name', $perm['name'])->get(db_prefix() . 'permissions')->row();
    if (!$exists) {
        $CI->db->insert(db_prefix() . 'permissions', [
            'name'       => $perm['name'],
            'short_name' => $perm['short_name'],
        ]);
    }
}
