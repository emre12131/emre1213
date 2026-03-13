<?php

defined('BASEPATH') or exit('No direct script access allowed');

// Modül meta
$lang['bluedot_menu_title']       = 'Bluedot Toplantılar';
$lang['bluedot_settings_title']   = 'Bluedot HQ Ayarları';
$lang['bluedot_meetings_log']     = 'Toplantı Kaydı';
$lang['bluedot_settings_saved']   = 'Bluedot ayarları başarıyla kaydedildi.';

// Ayar etiketleri
$lang['bluedot_webhook_url_label']          = 'Bluedot Webhook URL\'niz';
$lang['bluedot_webhook_url_info']           = 'Bu URL\'yi kopyalayarak Bluedot HQ panelinde Otomasyon → Webhook bölümüne yapıştırın. Her kayıt sonrasında Bluedot toplantı özetlerini bu adrese otomatik gönderecektir.';
$lang['bluedot_webhook_secret_label']       = 'Webhook Gizli Anahtarı';
$lang['bluedot_webhook_secret_help']        = 'İsteğe bağlı. Ayarlanırsa, Bluedot her istekte X-Bluedot-Signature başlığında HMAC-SHA256 imzası göndermelidir. İmza doğrulamayı devre dışı bırakmak için boş bırakın.';
$lang['bluedot_webhook_secret_placeholder'] = 'Bluedot webhook gizli anahtarınızı buraya yapıştırın…';
$lang['bluedot_note_prefix_label']          = 'Not / Etkinlik Başlık Öneki';
$lang['bluedot_create_notes_label']         = 'Her toplantı için otomatik CRM Notu oluştur';
$lang['bluedot_create_activities_label']    = 'Her toplantı için otomatik CRM Etkinliği oluştur';
$lang['bluedot_match_by_email_label']       = 'Katılımcıları e-posta ile mevcut Perfex kişileriyle eşleştir';
$lang['bluedot_include_action_items_label'] = 'Not içeriğine aksiyon maddelerini ekle';
$lang['bluedot_include_transcript_label']   = 'Not içeriğine tam transkripti ekle';
$lang['bluedot_include_transcript_warn']    = '(Not: transkriptler çok uzun olabilir)';
$lang['bluedot_notify_staff_label']         = 'Yeni toplantı geldiğinde bir personeli bilgilendir';
$lang['bluedot_notify_staff_member_label']  = 'Bilgilendirilecek personel';
$lang['bluedot_default_activity_type_label']= 'Varsayılan Etkinlik Türü';
$lang['bluedot_url_copied']                 = 'Webhook URL\'si panoya kopyalandı.';

// Toplantı kaydı sütunları
$lang['bluedot_col_title']        = 'Toplantı Başlığı';
$lang['bluedot_col_date']         = 'Toplantı Tarihi';
$lang['bluedot_col_platform']     = 'Platform';
$lang['bluedot_col_participants'] = 'Katılımcılar';
$lang['bluedot_col_contact']      = 'Eşleşen Kişi';
$lang['bluedot_col_duration']     = 'Süre';
$lang['bluedot_col_note']         = 'CRM Notu';

// Toplantı detayı
$lang['bluedot_meeting_detail']   = 'Toplantı Detayı';
$lang['bluedot_summary']          = 'Yapay Zeka Özeti';
$lang['bluedot_action_items']     = 'Aksiyon Maddeleri';
$lang['bluedot_transcript']       = 'Tam Transkript';
$lang['bluedot_participants']     = 'Katılımcılar';
$lang['bluedot_duration']         = 'Süre';
$lang['bluedot_recording']        = 'Kayıt';
$lang['bluedot_open_recording']   = 'Bluedot\'ta Aç';
$lang['bluedot_meeting_url']      = 'Toplantı URL';
$lang['bluedot_crm_note']         = 'CRM Notu';
$lang['bluedot_crm_activity']     = 'CRM Etkinliği';
$lang['bluedot_note_id']          = 'Not ID';
$lang['bluedot_activity_id']      = 'Etkinlik ID';
$lang['bluedot_linked_customer']  = 'Bağlantılı Müşteri';
$lang['bluedot_view_in_crm']      = 'CRM\'de Görüntüle';
$lang['bluedot_no_participants']  = 'Katılımcı verisi mevcut değil.';

// Durum etiketleri
$lang['bluedot_linked']           = 'Bağlantılı';
$lang['bluedot_no_match']         = 'Eşleşme yok';
$lang['bluedot_note_created']     = 'Not oluşturuldu';
$lang['bluedot_no_note']          = 'Not yok';

// Eylemler
$lang['bluedot_reprocess']         = 'Yeniden İşle';
$lang['bluedot_reprocess_confirm'] = 'Bu işlem mevcut not/etkinliği silip yeniden oluşturacaktır. Devam edilsin mi?';
$lang['bluedot_meeting_deleted']   = 'Toplantı kaydı silindi.';
$lang['bluedot_meeting_reprocessed'] = 'Toplantı başarıyla yeniden işlendi.';
$lang['bluedot_meeting_no_payload']  = 'Ham yük bulunamadı; yeniden işlenemiyor.';

// Boş durumlar
$lang['bluedot_no_meetings_yet']   = 'Henüz toplantı alınmadı. ';
$lang['bluedot_configure_webhook'] = 'Toplantı almaya başlamak için webhook\'unuzu yapılandırın.';

// Bildirimler
$lang['bluedot_notification_new_meeting'] = 'Yeni Bluedot toplantısı alındı: %s';
