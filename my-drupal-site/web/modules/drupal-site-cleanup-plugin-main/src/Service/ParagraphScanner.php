<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Finds paragraph entities that have no parent.
 */
class ParagraphScanner {

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
   * ParagraphScanner constructor.
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
   * Returns orphaned paragraph entities.
   *
   * @param int $limit
   *
   * @return array
   *   Keyed by id. Each value: id, type, created.
   */
  public function getOrphanedParagraphs(int $limit = 100): array {
    if (!$this->entityTypeManager->hasDefinition('paragraph')) {
      return [];
    }

    $table = NULL;
    if ($this->database->schema()->tableExists('paragraphs_item_field_data')) {
      $table = 'paragraphs_item_field_data';
    }
    elseif ($this->database->schema()->tableExists('paragraphs_item')) {
      $table = 'paragraphs_item';
    }

    if ($table === NULL) {
      return [];
    }

    $orphaned   = [];
    $ref_tables = $this->entityUsage->isAvailable() ? [] : $this->buildParaRefTables();

    $pids = $this->database->select($table, 'p')
      ->fields('p', ['id'])
      ->range(0, $limit)
      ->execute()
      ->fetchCol();

    $storage = $this->entityTypeManager->getStorage('paragraph');

    foreach ($pids as $pid) {
      if ($this->isParagraphReferenced((int) $pid, $ref_tables)) {
        continue;
      }
      $para = $storage->load($pid);
      if (!$para) {
        continue;
      }
      $orphaned[(int) $pid] = [
        'id'      => $pid,
        'type'    => $para->bundle(),
        'created' => $para->getCreatedTime(),
      ];
    }

    return $orphaned;
  }

  /**
   * Checks whether a paragraph is referenced anywhere.
   */
  protected function isParagraphReferenced(int $pid, array $ref_tables): bool {
    if ($this->entityUsage->isAvailable()) {
      return $this->entityUsage->isReferenced('paragraph', $pid);
    }

    foreach ($ref_tables as $table => $col) {
      if (!$this->database->schema()->tableExists($table)) {
        continue;
      }
      $n = (int) $this->database->select($table, 't')
        ->condition($col, $pid)
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
   * Builds a map of entity_reference_revisions fields targeting paragraph.
   * Only used when entity_usage is not available.
   */
  protected function buildParaRefTables(): array {
    $tables = [];
    foreach (['node', 'paragraph', 'block_content'] as $type) {
      try {
        foreach ($this->fieldManager->getFieldStorageDefinitions($type) as $field_name => $storage) {
          if (
            $storage->getType() === 'entity_reference_revisions' &&
            $storage->getSetting('target_type') === 'paragraph'
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
