<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<?php
$participants  = json_decode($meeting->participants, true) ?: [];
$action_items  = json_decode($meeting->action_items, true) ?: [];
?>

<div class="row">
    <!-- Left: Summary & Actions -->
    <div class="col-md-8">

        <!-- Meta -->
        <dl class="dl-horizontal">
            <dt><?php echo _l('bluedot_col_date'); ?></dt>
            <dd><?php echo date('d/m/Y H:i', strtotime($meeting->meeting_date)); ?></dd>

            <?php if ($meeting->platform): ?>
            <dt><?php echo _l('bluedot_col_platform'); ?></dt>
            <dd><span class="label label-default"><?php echo htmlspecialchars(ucfirst($meeting->platform)); ?></span></dd>
            <?php endif; ?>

            <?php if ($meeting->duration): ?>
            <dt><?php echo _l('bluedot_duration'); ?></dt>
            <dd><?php echo round($meeting->duration / 60); ?> min</dd>
            <?php endif; ?>

            <?php if ($meeting->recording_url): ?>
            <dt><?php echo _l('bluedot_recording'); ?></dt>
            <dd><a href="<?php echo htmlspecialchars($meeting->recording_url); ?>" target="_blank">
                <i class="fa fa-play-circle"></i> <?php echo _l('bluedot_open_recording'); ?>
            </a></dd>
            <?php endif; ?>

            <?php if ($meeting->meeting_url): ?>
            <dt><?php echo _l('bluedot_meeting_url'); ?></dt>
            <dd><a href="<?php echo htmlspecialchars($meeting->meeting_url); ?>" target="_blank" rel="noopener">
                <?php echo htmlspecialchars($meeting->meeting_url); ?>
            </a></dd>
            <?php endif; ?>

            <?php if ($meeting->note_id): ?>
            <dt><?php echo _l('bluedot_crm_note'); ?></dt>
            <dd><span class="label label-success"><?php echo _l('bluedot_note_id'); ?>: <?php echo $meeting->note_id; ?></span></dd>
            <?php endif; ?>

            <?php if ($meeting->activity_id): ?>
            <dt><?php echo _l('bluedot_crm_activity'); ?></dt>
            <dd><span class="label label-info"><?php echo _l('bluedot_activity_id'); ?>: <?php echo $meeting->activity_id; ?></span></dd>
            <?php endif; ?>

            <?php if ($meeting->customer_id): ?>
            <dt><?php echo _l('bluedot_linked_customer'); ?></dt>
            <dd>
                <a href="<?php echo admin_url('clients/client/' . $meeting->customer_id); ?>" target="_blank">
                    <i class="fa fa-building"></i> <?php echo _l('bluedot_view_in_crm'); ?>
                </a>
            </dd>
            <?php endif; ?>
        </dl>

        <hr>

        <!-- Summary -->
        <?php if ($meeting->summary): ?>
        <h4><?php echo _l('bluedot_summary'); ?></h4>
        <div class="well well-sm bluedot-summary">
            <?php echo nl2br(htmlspecialchars($meeting->summary)); ?>
        </div>
        <?php endif; ?>

        <!-- Action items -->
        <?php if (!empty($action_items)): ?>
        <h4><?php echo _l('bluedot_action_items'); ?></h4>
        <ul class="list-group">
            <?php foreach ($action_items as $item): ?>
                <li class="list-group-item">
                    <i class="fa fa-check-square-o"></i>
                    <?php echo htmlspecialchars(is_string($item) ? $item : ($item['text'] ?? json_encode($item))); ?>
                </li>
            <?php endforeach; ?>
        </ul>
        <?php endif; ?>

        <!-- Transcript (collapsible) -->
        <?php if ($meeting->transcript): ?>
        <div class="panel panel-default mtop20">
            <div class="panel-heading" role="button" data-toggle="collapse" data-target="#transcript-collapse"
                 aria-expanded="false" style="cursor:pointer;">
                <h4 class="panel-title">
                    <i class="fa fa-file-text-o"></i> <?php echo _l('bluedot_transcript'); ?>
                    <i class="fa fa-chevron-down pull-right"></i>
                </h4>
            </div>
            <div id="transcript-collapse" class="collapse">
                <div class="panel-body">
                    <pre class="bluedot-transcript"><?php echo htmlspecialchars($meeting->transcript); ?></pre>
                </div>
            </div>
        </div>
        <?php endif; ?>

    </div>

    <!-- Right: Participants -->
    <div class="col-md-4">
        <h4><?php echo _l('bluedot_participants'); ?></h4>

        <?php if (empty($participants)): ?>
            <p class="text-muted"><?php echo _l('bluedot_no_participants'); ?></p>
        <?php else: ?>
            <ul class="list-group">
                <?php foreach ($participants as $p): ?>
                    <?php
                    $name  = $p['name']  ?? $p['displayName'] ?? _l('unknown');
                    $email = $p['email'] ?? '';
                    ?>
                    <li class="list-group-item">
                        <i class="fa fa-user-circle-o"></i>
                        <strong><?php echo htmlspecialchars($name); ?></strong>
                        <?php if ($email): ?>
                            <br><small class="text-muted"><?php echo htmlspecialchars($email); ?></small>
                        <?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>

        <?php if (is_admin()): ?>
        <hr>
        <div class="btn-group-vertical" style="width:100%">
            <a href="<?php echo admin_url('bluedot/reprocess/' . $meeting->id); ?>"
               class="btn btn-default btn-sm"
               onclick="return confirm('<?php echo _l('bluedot_reprocess_confirm'); ?>')">
                <i class="fa fa-refresh"></i> <?php echo _l('bluedot_reprocess'); ?>
            </a>
            <a href="<?php echo admin_url('bluedot/delete/' . $meeting->id); ?>"
               class="btn btn-danger btn-sm"
               onclick="return confirm('<?php echo _l('confirm_action'); ?>')">
                <i class="fa fa-trash"></i> <?php echo _l('delete'); ?>
            </a>
        </div>
        <?php endif; ?>
    </div>

</div>

<style>
.bluedot-summary { white-space: pre-wrap; font-size: 14px; }
.bluedot-transcript { max-height: 600px; overflow-y: auto; font-size: 12px; }
</style>
