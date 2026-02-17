<?php

namespace Drupal\site_cleanup\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Settings form for Site Cleanup.
 */
class SettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['site_cleanup.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'site_cleanup_settings_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('site_cleanup.settings');

    $form['scan_limit'] = [
      '#type'          => 'number',
      '#title'         => $this->t('Maximum items per scan'),
      '#description'   => $this->t('Keeps page load times manageable on large sites.'),
      '#default_value' => $config->get('scan_limit') ? $config->get('scan_limit') : 100,
      '#min'           => 10,
      '#max'           => 2000,
    ];

    $form['unpublished_days'] = [
      '#type'          => 'number',
      '#title'         => $this->t('Stale unpublished threshold (days)'),
      '#description'   => $this->t('Unpublished nodes not edited within this many days appear in the stale content section.'),
      '#default_value' => $config->get('unpublished_days') ? $config->get('unpublished_days') : 90,
      '#min'           => 1,
    ];

    $form['log_deletions'] = [
      '#type'          => 'checkbox',
      '#title'         => $this->t('Log all deletions to watchdog'),
      '#default_value' => $config->get('log_deletions') !== NULL ? $config->get('log_deletions') : TRUE,
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('site_cleanup.settings')
      ->set('scan_limit', $form_state->getValue('scan_limit'))
      ->set('unpublished_days', $form_state->getValue('unpublished_days'))
      ->set('log_deletions', $form_state->getValue('log_deletions'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}
