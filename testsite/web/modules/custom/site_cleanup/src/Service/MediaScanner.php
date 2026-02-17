<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Finds media entities not referenced in content.
 */
class MediaScanner {

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
   * MediaScanner constructor.
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
   * Returns unreferenced media entities.
   *
   * @param int $limit
   *
   * @return array
   *   Keyed by mid. Each value: mid, name, bundle, created.
   */
  public function getUnusedMedia(int $limit = 100): array {
    if (
      !$this->entityTypeManager->hasDefinition('media') ||
      !$this->database->schema()->tableExists('media')
    ) {
      return [];
    }

    $unused     = [];
    $ref_tables = $this->entityUsage->isAvailable() ? [] : $this->buildMediaRefTables();

    $mids = $this->database->select('media', 'm')
      ->fields('m', ['mid'])
      ->range(0, $limit)
      ->execute()
      ->fetchCol();

    $storage = $this->entityTypeManager->getStorage('media');

    foreach ($mids as $mid) {
      if ($this->isMediaReferenced((int) $mid, $ref_tables)) {
        continue;
      }
      $media = $storage->load($mid);
      if (!$media) {
        continue;
      }
      $unused[(int) $mid] = [
        'mid'     => $mid,
        'name'    => $media->getName(),
        'bundle'  => $media->bundle(),
        'created' => $media->getCreatedTime(),
      ];
    }

    return $unused;
  }

  /**
   * Checks whether a media entity is referenced anywhere.
   */
  protected function isMediaReferenced(int $mid, array $ref_tables): bool {
    if ($this->entityUsage->isAvailable()) {
      return $this->entityUsage->isReferenced('media', $mid);
    }

    foreach ($ref_tables as $table => $col) {
      if (!$this->database->schema()->tableExists($table)) {
        continue;
      }
      $n = (int) $this->database->select($table, 't')
        ->condition($col, $mid)
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
   * Builds a map of entity reference fields targeting media.
   * Only used when entity_usage is not available.
   */
  protected function buildMediaRefTables(): array {
    $tables = [];
    foreach (['node', 'paragraph', 'block_content', 'taxonomy_term'] as $type) {
      try {
        foreach ($this->fieldManager->getFieldStorageDefinitions($type) as $field_name => $storage) {
          if (
            $storage->getType() === 'entity_reference' &&
            $storage->getSetting('target_type') === 'media'
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
