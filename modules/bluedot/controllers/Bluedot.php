<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Bluedot extends AdminController
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('bluedot/Bluedot_model');
    }

    /**
     * Module index — meeting log dashboard
     */
    public function index()
    {
        if (!has_permission('bluedot', '', 'view') && !is_admin()) {
            access_denied('bluedot');
        }

        $data['title']    = _l('bluedot_menu_title');
        $data['meetings'] = $this->Bluedot_model->get_meetings();

        $this->load->view('bluedot/header', $data);
        $this->load->view('bluedot/meetings_log', $data);
        $this->load->view('bluedot/footer');
    }

    /**
     * Settings page
     */
    public function settings()
    {
        if (!is_admin()) {
            access_denied('bluedot');
        }

        if ($this->input->post()) {
            $settings = [
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

            foreach ($settings as $setting) {
                $value = $this->input->post($setting);
                if ($value === false) {
                    $value = 0; // Handle unchecked checkboxes
                }
                update_option($setting, $value);
            }

            set_alert('success', _l('bluedot_settings_saved'));
            redirect(admin_url('bluedot/settings'));
        }

        $data['title']           = _l('bluedot_settings_title');
        $data['activity_types']  = $this->Bluedot_model->get_activity_types();
        $data['staff_members']   = $this->Bluedot_model->get_staff();
        $data['webhook_url']     = site_url('bluedot/webhook/receive');

        $this->load->view('bluedot/header', $data);
        $this->load->view('bluedot/settings', $data);
        $this->load->view('bluedot/footer');
    }

    /**
     * View a single meeting detail
     */
    public function view($id)
    {
        if (!has_permission('bluedot', '', 'view') && !is_admin()) {
            access_denied('bluedot');
        }

        $data['meeting'] = $this->Bluedot_model->get_meeting($id);

        if (!$data['meeting']) {
            show_404();
        }

        $data['title'] = _l('bluedot_meeting_detail') . ': ' . $data['meeting']->title;

        $this->load->view('bluedot/header', $data);
        $this->load->view('bluedot/meeting_detail', $data);
        $this->load->view('bluedot/footer');
    }

    /**
     * Delete a meeting record
     */
    public function delete($id)
    {
        if (!is_admin()) {
            access_denied('bluedot');
        }

        $this->Bluedot_model->delete_meeting($id);
        set_alert('success', _l('bluedot_meeting_deleted'));
        redirect(admin_url('bluedot'));
    }

    /**
     * Manually re-process a meeting (re-create notes/activities)
     */
    public function reprocess($id)
    {
        if (!is_admin()) {
            access_denied('bluedot');
        }

        $meeting = $this->Bluedot_model->get_meeting($id);

        if ($meeting && $meeting->raw_payload) {
            $payload = json_decode($meeting->raw_payload, true);
            $this->Bluedot_model->process_meeting_payload($payload, true);
            set_alert('success', _l('bluedot_meeting_reprocessed'));
        } else {
            set_alert('warning', _l('bluedot_meeting_no_payload'));
        }

        redirect(admin_url('bluedot/view/' . $id));
    }
}
