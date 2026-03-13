<?php

defined('BASEPATH') or exit('No direct script access allowed');

// Module meta
$lang['bluedot_menu_title']       = 'Bluedot Meetings';
$lang['bluedot_settings_title']   = 'Bluedot HQ Settings';
$lang['bluedot_meetings_log']     = 'Meetings Log';
$lang['bluedot_settings_saved']   = 'Bluedot settings saved successfully.';

// Settings labels
$lang['bluedot_webhook_url_label']          = 'Your Bluedot Webhook URL';
$lang['bluedot_webhook_url_info']           = 'Copy this URL and paste it into the Bluedot HQ dashboard under Automation → Webhook. Bluedot will send meeting summaries to this address automatically after each recording.';
$lang['bluedot_webhook_secret_label']       = 'Webhook Secret';
$lang['bluedot_webhook_secret_help']        = 'Optional. If set, Bluedot must send the matching HMAC-SHA256 signature in the X-Bluedot-Signature header. Leave blank to disable signature verification.';
$lang['bluedot_webhook_secret_placeholder'] = 'Paste your Bluedot webhook secret here…';
$lang['bluedot_note_prefix_label']          = 'Note / Activity Title Prefix';
$lang['bluedot_create_notes_label']         = 'Automatically create a CRM Note for each meeting';
$lang['bluedot_create_activities_label']    = 'Automatically create a CRM Activity for each meeting';
$lang['bluedot_match_by_email_label']       = 'Match participants to existing Perfex contacts by email';
$lang['bluedot_include_action_items_label'] = 'Include action items in the note body';
$lang['bluedot_include_transcript_label']   = 'Include full transcript in the note body';
$lang['bluedot_include_transcript_warn']    = '(Note: transcripts can be very long)';
$lang['bluedot_notify_staff_label']         = 'Notify a staff member when a new meeting is received';
$lang['bluedot_notify_staff_member_label']  = 'Staff member to notify';
$lang['bluedot_default_activity_type_label']= 'Default Activity Type';
$lang['bluedot_url_copied']                 = 'Webhook URL copied to clipboard.';

// Meetings log columns
$lang['bluedot_col_title']        = 'Meeting Title';
$lang['bluedot_col_date']         = 'Meeting Date';
$lang['bluedot_col_platform']     = 'Platform';
$lang['bluedot_col_participants'] = 'Participants';
$lang['bluedot_col_contact']      = 'Matched Contact';
$lang['bluedot_col_duration']     = 'Duration';
$lang['bluedot_col_note']         = 'CRM Note';

// Meeting detail
$lang['bluedot_meeting_detail']   = 'Meeting Detail';
$lang['bluedot_summary']          = 'AI Summary';
$lang['bluedot_action_items']     = 'Action Items';
$lang['bluedot_transcript']       = 'Full Transcript';
$lang['bluedot_participants']     = 'Participants';
$lang['bluedot_duration']         = 'Duration';
$lang['bluedot_recording']        = 'Recording';
$lang['bluedot_open_recording']   = 'Open in Bluedot';
$lang['bluedot_meeting_url']      = 'Meeting URL';
$lang['bluedot_crm_note']         = 'CRM Note';
$lang['bluedot_crm_activity']     = 'CRM Activity';
$lang['bluedot_note_id']          = 'Note ID';
$lang['bluedot_activity_id']      = 'Activity ID';
$lang['bluedot_linked_customer']  = 'Linked Customer';
$lang['bluedot_view_in_crm']      = 'View in CRM';
$lang['bluedot_no_participants']  = 'No participant data available.';

// Status labels
$lang['bluedot_linked']           = 'Linked';
$lang['bluedot_no_match']         = 'No match';
$lang['bluedot_note_created']     = 'Note created';
$lang['bluedot_no_note']          = 'No note';

// Actions
$lang['bluedot_reprocess']         = 'Re-process';
$lang['bluedot_reprocess_confirm'] = 'This will delete any existing note/activity linked to this meeting and recreate them. Continue?';
$lang['bluedot_meeting_deleted']   = 'Meeting record deleted.';
$lang['bluedot_meeting_reprocessed'] = 'Meeting re-processed successfully.';
$lang['bluedot_meeting_no_payload']  = 'No raw payload found; cannot re-process.';

// Empty states
$lang['bluedot_no_meetings_yet']   = 'No meetings received yet. ';
$lang['bluedot_configure_webhook'] = 'Configure your webhook to start receiving meetings.';

// Notifications
$lang['bluedot_notification_new_meeting'] = 'New Bluedot meeting received: %s';
