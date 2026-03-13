<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<?php if (empty($meetings)): ?>
    <div class="alert alert-info">
        <?php echo _l('bluedot_no_meetings_yet'); ?>
        <a href="<?php echo admin_url('bluedot/settings'); ?>"><?php echo _l('bluedot_configure_webhook'); ?></a>
    </div>
<?php else: ?>

<div class="table-responsive">
    <table class="table table-hover dt-table" id="bluedot-meetings-table">
        <thead>
            <tr>
                <th><?php echo _l('bluedot_col_title'); ?></th>
                <th><?php echo _l('bluedot_col_date'); ?></th>
                <th><?php echo _l('bluedot_col_platform'); ?></th>
                <th><?php echo _l('bluedot_col_participants'); ?></th>
                <th><?php echo _l('bluedot_col_contact'); ?></th>
                <th><?php echo _l('bluedot_col_duration'); ?></th>
                <th><?php echo _l('bluedot_col_note'); ?></th>
                <th><?php echo _l('options'); ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($meetings as $m): ?>
                <?php
                $participants = json_decode($m->participants, true) ?: [];
                $count = count($participants);
                ?>
                <tr>
                    <td>
                        <a href="<?php echo admin_url('bluedot/view/' . $m->id); ?>">
                            <?php echo htmlspecialchars($m->title); ?>
                        </a>
                    </td>
                    <td data-order="<?php echo $m->meeting_date; ?>">
                        <?php echo date('d/m/Y H:i', strtotime($m->meeting_date)); ?>
                    </td>
                    <td>
                        <?php if ($m->platform): ?>
                            <span class="label label-default"><?php echo htmlspecialchars(ucfirst($m->platform)); ?></span>
                        <?php else: ?>
                            <span class="text-muted">—</span>
                        <?php endif; ?>
                    </td>
                    <td><?php echo $count; ?></td>
                    <td>
                        <?php if ($m->contact_id): ?>
                            <a href="<?php echo admin_url('clients/contact/' . $m->contact_id); ?>" target="_blank">
                                <i class="fa fa-user"></i> <?php echo _l('bluedot_linked'); ?>
                            </a>
                        <?php else: ?>
                            <span class="text-muted"><?php echo _l('bluedot_no_match'); ?></span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ($m->duration): ?>
                            <?php echo round($m->duration / 60); ?> min
                        <?php else: ?>
                            <span class="text-muted">—</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ($m->note_id): ?>
                            <span class="label label-success"><i class="fa fa-check"></i> <?php echo _l('bluedot_note_created'); ?></span>
                        <?php else: ?>
                            <span class="label label-warning"><?php echo _l('bluedot_no_note'); ?></span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <div class="btn-group">
                            <a href="<?php echo admin_url('bluedot/view/' . $m->id); ?>"
                               class="btn btn-default btn-xs"
                               title="<?php echo _l('view'); ?>">
                                <i class="fa fa-eye"></i>
                            </a>
                            <?php if (is_admin()): ?>
                            <a href="<?php echo admin_url('bluedot/reprocess/' . $m->id); ?>"
                               class="btn btn-default btn-xs"
                               title="<?php echo _l('bluedot_reprocess'); ?>"
                               onclick="return confirm('<?php echo _l('bluedot_reprocess_confirm'); ?>')">
                                <i class="fa fa-refresh"></i>
                            </a>
                            <a href="<?php echo admin_url('bluedot/delete/' . $m->id); ?>"
                               class="btn btn-danger btn-xs"
                               title="<?php echo _l('delete'); ?>"
                               onclick="return confirm('<?php echo _l('confirm_action'); ?>')">
                                <i class="fa fa-trash"></i>
                            </a>
                            <?php endif; ?>
                        </div>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<script>
$(document).ready(function() {
    $('#bluedot-meetings-table').DataTable({
        order: [[1, 'desc']],
        pageLength: 25,
        responsive: true
    });
});
</script>

<?php endif; ?>
