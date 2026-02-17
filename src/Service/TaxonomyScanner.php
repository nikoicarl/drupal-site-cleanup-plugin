<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Finds taxonomy terms not referenced in any content.
 */
class TaxonomyScanner {

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
   * TaxonomyScanner constructor.
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
   * Returns unused taxonomy terms.
   *
   * @param int $limit
   *
   * @return array
   *   Keyed by tid. Each value: tid, name, vocabulary.
   */
  public function getUnusedTerms(int $limit = 200): array {
    $unused     = [];
    $ref_tables = $this->entityUsage->isAvailable() ? [] : $this->buildTermRefTables();

    $tids = $this->database->select('taxonomy_term_data', 't')
      ->fields('t', ['tid'])
      ->range(0, $limit)
      ->execute()
      ->fetchCol();

    $storage = $this->entityTypeManager->getStorage('taxonomy_term');

    foreach ($tids as $tid) {
      if ($this->isTermReferenced((int) $tid, $ref_tables)) {
        continue;
      }
      $term = $storage->load($tid);
      if (!$term) {
        continue;
      }
      $unused[(int) $tid] = [
        'tid'        => $tid,
        'name'       => $term->getName(),
        'vocabulary' => $term->bundle(),
      ];
    }

    return $unused;
  }

  /**
   * Checks whether a term is referenced anywhere.
   */
  protected function isTermReferenced(int $tid, array $ref_tables): bool {
    if ($this->entityUsage->isAvailable()) {
      return $this->entityUsage->isReferenced('taxonomy_term', $tid);
    }

    foreach ($ref_tables as $table => $col) {
      if (!$this->database->schema()->tableExists($table)) {
        continue;
      }
      $n = (int) $this->database->select($table, 't')
        ->condition($col, $tid)
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
   * Builds a map of entity reference fields targeting taxonomy_term.
   * Only used when entity_usage is not available.
   */
  protected function buildTermRefTables(): array {
    $tables = [];
    foreach (['node', 'paragraph', 'user', 'block_content', 'media'] as $type) {
      try {
        foreach ($this->fieldManager->getFieldStorageDefinitions($type) as $field_name => $storage) {
          if (
            $storage->getType() === 'entity_reference' &&
            $storage->getSetting('target_type') === 'taxonomy_term'
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
