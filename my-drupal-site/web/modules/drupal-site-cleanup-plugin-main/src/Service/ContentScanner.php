<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Finds orphaned nodes and stale unpublished nodes.
 *
 * When entity_usage is available it queries the entity usage tracking table
 * for accurate results. When it is not available it falls back to scanning
 * entity reference field tables and the menu_link_content_data table.
 */
class ContentScanner {

  /**
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * @var \Drupal\Core\Entity\EntityFieldManagerInterface
   */
  protected $fieldManager;

  /**
   * @var \Drupal\site_cleanup\Service\EntityUsageBridge
   */
  protected $entityUsage;

  /**
   * ContentScanner constructor.
   */
  public function __construct(
    EntityTypeManagerInterface $entityTypeManager,
    Connection $database,
    EntityFieldManagerInterface $fieldManager,
    EntityUsageBridge $entityUsage
  ) {
    $this->entityTypeManager = $entityTypeManager;
    $this->database          = $database;
    $this->fieldManager      = $fieldManager;
    $this->entityUsage       = $entityUsage;
  }

  /**
   * Returns nodes not referenced anywhere and with no menu links.
   *
   * @param int $limit
   *
   * @return array
   *   Keyed by nid. Each value: nid, title, type, created, changed.
   */
  public function getOrphanedNodes(int $limit = 100): array {
    $orphaned = [];

    $nids = $this->database->select('node', 'n')
      ->fields('n', ['nid'])
      ->range(0, $limit)
      ->execute()
      ->fetchCol();

    $storage    = $this->entityTypeManager->getStorage('node');
    $ref_tables = $this->entityUsage->isAvailable() ? [] : $this->buildNodeRefTables();

    foreach ($nids as $nid) {
      if ($this->isNodeReferenced((int) $nid, $ref_tables)) {
        continue;
      }
      $node = $storage->load($nid);
      if (!$node) {
        continue;
      }
      $orphaned[(int) $nid] = [
        'nid'         => $nid,
        'title'       => $node->getTitle(),
        'type'        => $node->bundle(),
        'created'     => $node->getCreatedTime(),
        'changed'     => $node->getChangedTime(),
      ];
    }

    return $orphaned;
  }

  /**
   * Returns unpublished nodes not edited within $days days.
   *
   * @param int $days
   * @param int $limit
   *
   * @return array
   *   Keyed by nid. Each value: nid, title, type, days_old, changed.
   */
  public function getStaleUnpublishedNodes(int $days = 90, int $limit = 100): array {
    $stale  = [];
    $cutoff = strtotime('-' . $days . ' days');

    $nids = $this->database->select('node_field_data', 'n')
      ->fields('n', ['nid'])
      ->condition('status', 0)
      ->condition('changed', $cutoff, '<')
      ->range(0, $limit)
      ->execute()
      ->fetchCol();

    $storage = $this->entityTypeManager->getStorage('node');

    foreach ($nids as $nid) {
      $node = $storage->load($nid);
      if (!$node) {
        continue;
      }
      $stale[(int) $nid] = [
        'nid'      => $nid,
        'title'    => $node->getTitle(),
        'type'     => $node->bundle(),
        'days_old' => (int) floor((time() - $node->getChangedTime()) / 86400),
        'changed'  => $node->getChangedTime(),
      ];
    }

    return $stale;
  }

  /**
   * Checks whether a node is referenced anywhere.
   *
   * Uses entity_usage when available, otherwise falls back to a direct
   * field-table scan and menu link check.
   */
  protected function isNodeReferenced(int $nid, array $ref_tables): bool {
    // entity_usage path — fast and comprehensive.
    if ($this->entityUsage->isAvailable()) {
      return $this->entityUsage->isReferenced('node', $nid);
    }

    // Fallback: scan entity reference field tables.
    foreach ($ref_tables as $table => $col) {
      if (!$this->database->schema()->tableExists($table)) {
        continue;
      }
      $n = (int) $this->database->select($table, 't')
        ->condition($col, $nid)
        ->countQuery()
        ->execute()
        ->fetchField();
      if ($n > 0) {
        return TRUE;
      }
    }

    // Fallback: check menu links.
    if ($this->database->schema()->tableExists('menu_link_content_data')) {
      $n = (int) $this->database->select('menu_link_content_data', 'm')
        ->condition('link__uri', 'entity:node/' . $nid)
        ->countQuery()
        ->execute()
        ->fetchField();
      if ($n > 0) {
        return TRUE;
      }
    }

    return FALSE;
  }

  /**
   * Builds a map of entity reference field tables pointing at nodes.
   * Only used when entity_usage is not available.
   */
  protected function buildNodeRefTables(): array {
    $tables = [];
    foreach (['node', 'paragraph', 'block_content', 'taxonomy_term'] as $type) {
      try {
        foreach ($this->fieldManager->getFieldStorageDefinitions($type) as $field_name => $storage) {
          if (
            $storage->getType() === 'entity_reference' &&
            $storage->getSetting('target_type') === 'node'
          ) {
            $tables[$type . '__' . $field_name] = $field_name . '_target_id';
          }
        }
      }
      catch (\Exception $e) {
        // Entity type does not exist on this site.
      }
    }
    return $tables;
  }

}
