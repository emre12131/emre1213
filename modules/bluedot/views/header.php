<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<div id="wrapper">
    <?php include(APPPATH . 'views/includes/sidebar.php'); ?>
    <div id="page-wrapper" class="bluedot-module">
        <div class="content">
            <div class="row">
                <div class="col-md-12">
                    <div class="panel_s">
                        <div class="panel-heading">
                            <h4 class="panel-title">
                                <i class="fa fa-dot-circle-o"></i> <?php echo $title; ?>
                            </h4>
                            <?php if (is_admin()): ?>
                            <div class="pull-right mtop5">
                                <a href="<?php echo admin_url('bluedot/settings'); ?>" class="btn btn-default btn-sm">
                                    <i class="fa fa-cog"></i> <?php echo _l('settings'); ?>
                                </a>
                                <a href="<?php echo admin_url('bluedot'); ?>" class="btn btn-default btn-sm">
                                    <i class="fa fa-list"></i> <?php echo _l('bluedot_meetings_log'); ?>
                                </a>
                            </div>
                            <?php endif; ?>
                        </div>
                        <div class="panel-body">
