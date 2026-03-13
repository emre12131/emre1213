<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Bluedot_model extends App_Model
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Process an inbound Bluedot webhook payload.
     *
     * @param  array $payload   Decoded JSON from Bluedot
     * @param  bool  $reprocess If true, delete old note/activity and recreate
     * @return array            ['success' => bool, 'meeting_id' => int, 'message' => string]
     */
    public function process_meeting_payload(array $payload, bool $reprocess = false): array
    {
        $bluedot_id = $this->_extract_meeting_id($payload);

        if (!$bluedot_id) {
            return ['success' => false, 'meeting_id' => null, 'message' => 'Missing meeting identifier in payload'];
        }

        // Check for duplicate (idempotency)
        $existing = $this->get_meeting_by_bluedot_id($bluedot_id);

        if ($existing && !$reprocess) {
            return ['success' => true, 'meeting_id' => $existing->id, 'message' => 'Meeting already processed'];
        }

        // Parse core meeting data
        $meeting_data = $this->_parse_payload($payload);

        // Attempt to match participants to Perfex contacts/customers
        $match = $this->_match_contacts($meeting_data['participants']);
        $meeting_data['contact_id']  = $match['contact_id'];
        $meeting_data['customer_id'] = $match['customer_id'];

        if ($existing && $reprocess) {
            // Clean up previous linked records if reprocessing
            $this->_cleanup_linked_records($existing);
            $this->db->where('id', $existing->id)->update(db_prefix() . 'bluedot_meetings', $meeting_data);
            $db_meeting_id = $existing->id;
        } else {
            $this->db->insert(db_prefix() . 'bluedot_meetings', $meeting_data);
            $db_meeting_id = $this->db->insert_id();
        }

        $update = [];

        // Create a Note in Perfex CRM
        if (get_option('bluedot_create_notes') == 1) {
            $note_id = $this->_create_note($meeting_data);
            if ($note_id) {
                $update['note_id'] = $note_id;
            }
        }

        // Create an Activity in Perfex CRM
        if (get_option('bluedot_create_activities') == 1) {
            $activity_id = $this->_create_activity($meeting_data);
            if ($activity_id) {
                $update['activity_id'] = $activity_id;
            }
        }

        if (!empty($update)) {
            $this->db->where('id', $db_meeting_id)->update(db_prefix() . 'bluedot_meetings', $update);
        }

        // Notify staff if configured
        if (get_option('bluedot_notify_staff') == 1) {
            $this->_notify_staff($db_meeting_id, $meeting_data);
        }

        return [
            'success'    => true,
            'meeting_id' => $db_meeting_id,
            'message'    => 'Meeting processed successfully',
        ];
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Extract a unique Bluedot meeting identifier from the payload.
     * Bluedot may use different field names depending on payload version.
     */
    private function _extract_meeting_id(array $payload): ?string
    {
        $candidates = [
            $payload['meeting']['id']  ?? null,
            $payload['id']             ?? null,
            $payload['meetingId']      ?? null,
            $payload['meeting_id']     ?? null,
        ];

        foreach ($candidates as $id) {
            if (!empty($id)) {
                return (string) $id;
            }
        }

        return null;
    }

    /**
     * Parse all fields from the Bluedot payload into a flat array
     * ready for database insertion.
     */
    private function _parse_payload(array $payload): array
    {
        $meeting = $payload['meeting'] ?? $payload;

        $title       = $meeting['title']   ?? $payload['title']   ?? 'Untitled Meeting';
        $date_raw    = $meeting['date']    ?? $payload['date']    ?? $payload['startedAt'] ?? null;
        $platform    = $meeting['platform'] ?? $payload['platform'] ?? null;
        $meeting_url = $meeting['url']     ?? $payload['url']     ?? null;
        $rec_url     = $payload['recordingUrl'] ?? $payload['recording_url'] ?? $meeting['recordingUrl'] ?? null;
        $duration    = $meeting['duration'] ?? $payload['duration'] ?? null;

        $summary      = $payload['summary']     ?? $payload['notes'] ?? null;
        $transcript   = $payload['transcript']  ?? null;
        $action_items = $payload['actionItems'] ?? $payload['action_items'] ?? [];
        $participants = $payload['participants'] ?? $payload['attendees'] ?? [];

        return [
            'bluedot_id'    => $this->_extract_meeting_id($payload),
            'title'         => substr($title, 0, 500),
            'meeting_date'  => $date_raw ? date('Y-m-d H:i:s', strtotime($date_raw)) : date('Y-m-d H:i:s'),
            'platform'      => $platform ? substr($platform, 0, 100) : null,
            'meeting_url'   => $meeting_url,
            'recording_url' => $rec_url,
            'duration'      => is_numeric($duration) ? (int) $duration : null,
            'summary'       => $summary,
            'transcript'    => $transcript,
            'action_items'  => is_array($action_items) ? json_encode($action_items) : $action_items,
            'participants'  => is_array($participants) ? json_encode($participants) : $participants,
            'raw_payload'   => json_encode($payload),
        ];
    }

    /**
     * Try to find a matching Perfex contact and customer based on participant emails.
     */
    private function _match_contacts(array $participants_raw): array
    {
        $result = ['contact_id' => null, 'customer_id' => null];

        if (!get_option('bluedot_match_by_email')) {
            return $result;
        }

        $participants = is_string($participants_raw)
            ? json_decode($participants_raw, true)
            : $participants_raw;

        if (empty($participants) || !is_array($participants)) {
            return $result;
        }

        foreach ($participants as $participant) {
            $email = $participant['email'] ?? null;

            if (empty($email)) {
                continue;
            }

            // Look for a matching contact in Perfex
            $contact = $this->db
                ->where('email', $email)
                ->get(db_prefix() . 'contacts')
                ->row();

            if ($contact) {
                $result['contact_id']  = $contact->id;
                $result['customer_id'] = $contact->userid;
                break; // Use the first match
            }
        }

        return $result;
    }

    /**
     * Build the note content from meeting data.
     */
    private function _build_note_content(array $meeting_data): string
    {
        $prefix  = get_option('bluedot_note_prefix') ?: '[Bluedot] ';
        $parts   = [];

        $parts[] = '**' . $prefix . $meeting_data['title'] . '**';
        $parts[] = '';

        if ($meeting_data['meeting_date']) {
            $parts[] = '**Date:** ' . $meeting_data['meeting_date'];
        }

        if ($meeting_data['platform']) {
            $parts[] = '**Platform:** ' . ucfirst($meeting_data['platform']);
        }

        if ($meeting_data['duration']) {
            $minutes = round($meeting_data['duration'] / 60);
            $parts[] = '**Duration:** ' . $minutes . ' min';
        }

        if ($meeting_data['recording_url']) {
            $parts[] = '**Recording:** ' . $meeting_data['recording_url'];
        }

        if ($meeting_data['meeting_url']) {
            $parts[] = '**Meeting URL:** ' . $meeting_data['meeting_url'];
        }

        $parts[] = '';

        // Summary
        if (!empty($meeting_data['summary'])) {
            $parts[] = '**Summary:**';
            $parts[] = $meeting_data['summary'];
            $parts[] = '';
        }

        // Action items
        if (get_option('bluedot_include_action_items') && !empty($meeting_data['action_items'])) {
            $action_items = is_string($meeting_data['action_items'])
                ? json_decode($meeting_data['action_items'], true)
                : $meeting_data['action_items'];

            if (!empty($action_items) && is_array($action_items)) {
                $parts[] = '**Action Items:**';
                foreach ($action_items as $item) {
                    $parts[] = '- ' . (is_string($item) ? $item : ($item['text'] ?? json_encode($item)));
                }
                $parts[] = '';
            }
        }

        // Participants
        if (!empty($meeting_data['participants'])) {
            $participants = is_string($meeting_data['participants'])
                ? json_decode($meeting_data['participants'], true)
                : $meeting_data['participants'];

            if (!empty($participants) && is_array($participants)) {
                $parts[] = '**Participants:**';
                foreach ($participants as $p) {
                    $name  = $p['name']  ?? $p['displayName'] ?? '';
                    $email = $p['email'] ?? '';
                    $line  = '- ' . $name;
                    if ($email) {
                        $line .= ' (' . $email . ')';
                    }
                    $parts[] = $line;
                }
                $parts[] = '';
            }
        }

        // Transcript (optional, can be very long)
        if (get_option('bluedot_include_transcript') && !empty($meeting_data['transcript'])) {
            $parts[] = '**Transcript:**';
            $parts[] = $meeting_data['transcript'];
        }

        return implode("\n", $parts);
    }

    /**
     * Create a Perfex CRM customer note for the meeting.
     */
    private function _create_note(array $meeting_data): ?int
    {
        if (empty($meeting_data['customer_id'])) {
            return null;
        }

        $this->load->model('notes_model');

        $note_data = [
            'rel_id'        => $meeting_data['customer_id'],
            'rel_type'      => 'customer',
            'description'   => $this->_build_note_content($meeting_data),
            'date_contacted' => $meeting_data['meeting_date'],
            'addedfrom'     => get_staff_user_id(),
        ];

        return $this->notes_model->add($note_data);
    }

    /**
     * Create a Perfex CRM activity (call log) for the meeting.
     */
    private function _create_activity(array $meeting_data): ?int
    {
        if (empty($meeting_data['customer_id'])) {
            return null;
        }

        $activity_type = get_option('bluedot_default_activity_type') ?: 9;
        $prefix        = get_option('bluedot_note_prefix') ?: '[Bluedot] ';

        $activity_data = [
            'rel_id'       => $meeting_data['customer_id'],
            'rel_type'     => 'customer',
            'description'  => $prefix . $meeting_data['title'],
            'activity_type'=> $activity_type,
            'date'         => $meeting_data['meeting_date'],
            'addedfrom'    => get_staff_user_id(),
        ];

        $this->db->insert(db_prefix() . 'customer_activity', $activity_data);

        return $this->db->insert_id() ?: null;
    }

    /**
     * Delete linked Perfex records when reprocessing a meeting.
     */
    private function _cleanup_linked_records($existing_meeting): void
    {
        if (!empty($existing_meeting->note_id)) {
            $this->db->where('id', $existing_meeting->note_id)->delete(db_prefix() . 'notes');
        }

        if (!empty($existing_meeting->activity_id)) {
            $this->db->where('id', $existing_meeting->activity_id)->delete(db_prefix() . 'customer_activity');
        }
    }

    /**
     * Send an internal Perfex notification to configured staff member.
     */
    private function _notify_staff(int $meeting_db_id, array $meeting_data): void
    {
        $staff_id = get_option('bluedot_notify_staff_id');

        if (empty($staff_id)) {
            return;
        }

        $this->load->model('staff_model');

        add_notification([
            'fromcompany'      => 1,
            'touserid'         => $staff_id,
            'description'      => 'bluedot_notification_new_meeting',
            'link'             => 'bluedot/view/' . $meeting_db_id,
            'additional_data'  => serialize([$meeting_data['title']]),
        ]);
    }

    // -----------------------------------------------------------------------
    // CRUD helpers
    // -----------------------------------------------------------------------

    public function get_meetings(int $limit = 50): array
    {
        return $this->db
            ->order_by('meeting_date', 'DESC')
            ->limit($limit)
            ->get(db_prefix() . 'bluedot_meetings')
            ->result();
    }

    public function get_meeting(int $id): ?object
    {
        return $this->db
            ->where('id', $id)
            ->get(db_prefix() . 'bluedot_meetings')
            ->row();
    }

    public function get_meeting_by_bluedot_id(string $bluedot_id): ?object
    {
        return $this->db
            ->where('bluedot_id', $bluedot_id)
            ->get(db_prefix() . 'bluedot_meetings')
            ->row();
    }

    public function delete_meeting(int $id): void
    {
        $meeting = $this->get_meeting($id);

        if ($meeting) {
            $this->_cleanup_linked_records($meeting);
        }

        $this->db->where('id', $id)->delete(db_prefix() . 'bluedot_meetings');
    }

    public function get_activity_types(): array
    {
        return $this->db->get(db_prefix() . 'activity_log_types')->result();
    }

    public function get_staff(): array
    {
        return $this->db
            ->select('staffid, firstname, lastname, email')
            ->where('active', 1)
            ->get(db_prefix() . 'staff')
            ->result();
    }
}
