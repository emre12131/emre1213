<?php

defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Webhook controller — receives inbound payloads from Bluedot HQ
 *
 * Endpoint: POST /bluedot/webhook/receive
 *
 * Bluedot sends a webhook immediately after each meeting's summary
 * and transcript are ready. The module verifies the request signature,
 * parses the payload, then creates Perfex CRM notes/activities.
 */
class Webhook extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('bluedot/Bluedot_model');
    }

    /**
     * Main webhook receiver
     */
    public function receive()
    {
        // Only accept POST requests
        if ($this->input->server('REQUEST_METHOD') !== 'POST') {
            $this->_respond(405, ['error' => 'Method Not Allowed']);
            return;
        }

        // Read raw body
        $raw_body = file_get_contents('php://input');

        if (empty($raw_body)) {
            $this->_respond(400, ['error' => 'Empty request body']);
            return;
        }

        // Verify webhook signature if a secret is configured
        $secret = get_option('bluedot_webhook_secret');
        if (!empty($secret)) {
            $signature_header = $this->input->server('HTTP_X_BLUEDOT_SIGNATURE');
            if (!$this->_verify_signature($raw_body, $signature_header, $secret)) {
                log_message('error', 'Bluedot webhook: invalid signature');
                $this->_respond(401, ['error' => 'Invalid signature']);
                return;
            }
        }

        // Parse JSON payload
        $payload = json_decode($raw_body, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($payload)) {
            log_message('error', 'Bluedot webhook: invalid JSON payload');
            $this->_respond(400, ['error' => 'Invalid JSON payload']);
            return;
        }

        // Process the meeting payload
        $result = $this->Bluedot_model->process_meeting_payload($payload);

        if ($result['success']) {
            $this->_respond(200, [
                'status'     => 'ok',
                'meeting_id' => $result['meeting_id'],
                'message'    => $result['message'],
            ]);
        } else {
            log_message('error', 'Bluedot webhook processing error: ' . $result['message']);
            $this->_respond(422, ['error' => $result['message']]);
        }
    }

    /**
     * Verify Bluedot webhook HMAC-SHA256 signature
     *
     * Bluedot signs payloads with:
     *   X-Bluedot-Signature: sha256=<hmac_hex>
     */
    private function _verify_signature($body, $signature_header, $secret)
    {
        if (empty($signature_header)) {
            return false;
        }

        // Header format: "sha256=<hex_digest>"
        if (strpos($signature_header, 'sha256=') !== 0) {
            return false;
        }

        $received_hash = substr($signature_header, 7);
        $expected_hash = hash_hmac('sha256', $body, $secret);

        return hash_equals($expected_hash, $received_hash);
    }

    /**
     * Send a JSON response and exit
     */
    private function _respond($status_code, $data)
    {
        http_response_code($status_code);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
