<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Finds Views not exposed via any active display.
 */
class ViewScanner {

  /**
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * ViewScanner constructor.
   */
  public function __construct(EntityTypeManagerInterface $entityTypeManager, Connection $database) {
    $this->entityTypeManager = $entityTypeManager;
    $this->database          = $database;
  }

  /**
   * Returns views that have no active or placed displays.
   *
   * @return array
   *   Keyed by view id. Each value: id, label, display_count.
   */
  public function getUnusedViews(): array {
    if (!$this->entityTypeManager->hasDefinition('view')) {
      return [];
    }

    $active_types = ['page', 'feed', 'rest_export', 'data_export', 'embed'];
    $unused       = [];

    foreach ($this->entityTypeManager->getStorage('view')->loadMultiple() as $view_id => $view) {
      $in_use   = FALSE;
      $displays = $view->get('display');

      foreach ($displays as $display_id => $display) {
        $plugin = isset($display['display_plugin']) ? $display['display_plugin'] : '';

        if (in_array($plugin, $active_types, TRUE)) {
          $in_use = TRUE;
          break;
        }

        if ($plugin === 'block') {
          $placed = $this->entityTypeManager->getStorage('block')
            ->loadByProperties(['plugin' => 'views_block:' . $view_id . '-' . $display_id]);
          if (!empty($placed)) {
            $in_use = TRUE;
            break;
          }
        }
      }

      if (!$in_use) {
        $unused[$view_id] = [
          'id'            => $view_id,
          'label'         => $view->label(),
          'display_count' => count($displays),
        ];
      }
    }

    return $unused;
  }

}
