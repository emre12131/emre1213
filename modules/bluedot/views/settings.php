<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<!-- Webhook URL info box -->
<div class="alert alert-info">
    <strong><?php echo _l('bluedot_webhook_url_label'); ?></strong><br>
    <?php echo _l('bluedot_webhook_url_info'); ?><br>
    <code id="bluedot-webhook-url"><?php echo $webhook_url; ?></code>
    <button type="button" class="btn btn-xs btn-default mtop5"
            onclick="copyToClipboard('<?php echo $webhook_url; ?>')">
        <i class="fa fa-copy"></i> <?php echo _l('copy'); ?>
    </button>
</div>

<?php echo form_open(admin_url('bluedot/settings'), ['id' => 'bluedot-settings-form']); ?>

    <div class="row">

        <!-- Left column -->
        <div class="col-md-6">

            <div class="form-group">
                <label for="bluedot_webhook_secret">
                    <?php echo _l('bluedot_webhook_secret_label'); ?>
                    <i class="fa fa-question-circle help-icon" data-toggle="tooltip"
                       title="<?php echo _l('bluedot_webhook_secret_help'); ?>"></i>
                </label>
                <input type="password" name="bluedot_webhook_secret" id="bluedot_webhook_secret"
                       class="form-control"
                       value="<?php echo htmlspecialchars(get_option('bluedot_webhook_secret')); ?>"
                       placeholder="<?php echo _l('bluedot_webhook_secret_placeholder'); ?>">
            </div>

            <div class="form-group">
                <label><?php echo _l('bluedot_note_prefix_label'); ?></label>
                <input type="text" name="bluedot_note_prefix" class="form-control"
                       value="<?php echo htmlspecialchars(get_option('bluedot_note_prefix')); ?>"
                       placeholder="[Bluedot] ">
            </div>

            <div class="form-group">
                <label><?php echo _l('bluedot_default_activity_type_label'); ?></label>
                <select name="bluedot_default_activity_type" class="form-control">
                    <?php foreach ($activity_types as $type): ?>
                        <option value="<?php echo $type->id; ?>"
                            <?php echo get_option('bluedot_default_activity_type') == $type->id ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($type->name ?? $type->activity_name ?? $type->id); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

        </div>

        <!-- Right column -->
        <div class="col-md-6">

            <div class="checkbox checkbox-primary">
                <input type="hidden" name="bluedot_create_notes" value="0">
                <input type="checkbox" name="bluedot_create_notes" id="bluedot_create_notes"
                       value="1" <?php echo get_option('bluedot_create_notes') == 1 ? 'checked' : ''; ?>>
                <label for="bluedot_create_notes">
                    <?php echo _l('bluedot_create_notes_label'); ?>
                </label>
            </div>

            <div class="checkbox checkbox-primary">
                <input type="hidden" name="bluedot_create_activities" value="0">
                <input type="checkbox" name="bluedot_create_activities" id="bluedot_create_activities"
                       value="1" <?php echo get_option('bluedot_create_activities') == 1 ? 'checked' : ''; ?>>
                <label for="bluedot_create_activities">
                    <?php echo _l('bluedot_create_activities_label'); ?>
                </label>
            </div>

            <div class="checkbox checkbox-primary">
                <input type="hidden" name="bluedot_match_by_email" value="0">
                <input type="checkbox" name="bluedot_match_by_email" id="bluedot_match_by_email"
                       value="1" <?php echo get_option('bluedot_match_by_email') == 1 ? 'checked' : ''; ?>>
                <label for="bluedot_match_by_email">
                    <?php echo _l('bluedot_match_by_email_label'); ?>
                </label>
            </div>

            <div class="checkbox checkbox-primary">
                <input type="hidden" name="bluedot_include_action_items" value="0">
                <input type="checkbox" name="bluedot_include_action_items" id="bluedot_include_action_items"
                       value="1" <?php echo get_option('bluedot_include_action_items') == 1 ? 'checked' : ''; ?>>
                <label for="bluedot_include_action_items">
                    <?php echo _l('bluedot_include_action_items_label'); ?>
                </label>
            </div>

            <div class="checkbox checkbox-primary">
                <input type="hidden" name="bluedot_include_transcript" value="0">
                <input type="checkbox" name="bluedot_include_transcript" id="bluedot_include_transcript"
                       value="1" <?php echo get_option('bluedot_include_transcript') == 1 ? 'checked' : ''; ?>>
                <label for="bluedot_include_transcript">
                    <?php echo _l('bluedot_include_transcript_label'); ?>
                    <small class="text-muted"><?php echo _l('bluedot_include_transcript_warn'); ?></small>
                </label>
            </div>

            <hr>

            <div class="checkbox checkbox-primary">
                <input type="hidden" name="bluedot_notify_staff" value="0">
                <input type="checkbox" name="bluedot_notify_staff" id="bluedot_notify_staff"
                       value="1" <?php echo get_option('bluedot_notify_staff') == 1 ? 'checked' : ''; ?>
                       onchange="toggleStaffSelect(this)">
                <label for="bluedot_notify_staff">
                    <?php echo _l('bluedot_notify_staff_label'); ?>
                </label>
            </div>

            <div id="bluedot_staff_select_wrap"
                 style="<?php echo get_option('bluedot_notify_staff') == 1 ? '' : 'display:none;'; ?>">
                <div class="form-group">
                    <label><?php echo _l('bluedot_notify_staff_member_label'); ?></label>
                    <select name="bluedot_notify_staff_id" class="form-control">
                        <option value=""><?php echo _l('none'); ?></option>
                        <?php foreach ($staff_members as $staff): ?>
                            <option value="<?php echo $staff->staffid; ?>"
                                <?php echo get_option('bluedot_notify_staff_id') == $staff->staffid ? 'selected' : ''; ?>>
                                <?php echo htmlspecialchars($staff->firstname . ' ' . $staff->lastname); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

        </div><!-- /.col -->

    </div><!-- /.row -->

    <hr>

    <button type="submit" class="btn btn-primary">
        <?php echo _l('submit'); ?>
    </button>

<?php echo form_close(); ?>

<script>
function toggleStaffSelect(el) {
    document.getElementById('bluedot_staff_select_wrap').style.display = el.checked ? '' : 'none';
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            alert_float('success', '<?php echo _l('bluedot_url_copied'); ?>');
        });
    } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert_float('success', '<?php echo _l('bluedot_url_copied'); ?>');
    }
}
</script>
