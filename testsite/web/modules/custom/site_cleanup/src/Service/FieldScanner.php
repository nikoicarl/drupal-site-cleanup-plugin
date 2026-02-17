<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityFieldManagerInterface;

/**
 * Finds custom fields that contain zero rows of data.
 */
class FieldScanner {

  /**
   * @var \Drupal\Core\Entity\EntityFieldManagerInterface
   */
  protected $fieldManager;

  /**
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * FieldScanner constructor.
   */
  public function __construct(EntityFieldManagerInterface $fieldManager, Connection $database) {
    $this->fieldManager = $fieldManager;
    $this->database     = $database;
  }

  /**
   * Returns empty fields across common entity types.
   *
   * @return array
   *   Keyed by field_name. Each value: name, type, entity_type.
   */
  public function getEmptyFields(): array {
    $all = [];
    foreach (['node', 'taxonomy_term', 'user', 'block_content', 'paragraph'] as $type) {
      try {
        $all = array_merge($all, $this->emptyForType($type));
      }
      catch (\Exception $e) {
        // Entity type not present on this site.
      }
    }
    return $all;
  }

  /**
   * Returns empty fields for a single entity type.
   */
  protected function emptyForType(string $entity_type): array {
    $empty = [];

    foreach ($this->fieldManager->getFieldStorageDefinitions($entity_type) as $name => $storage) {
      if ($storage->isBaseField()) {
        continue;
      }

      $table = $entity_type . '__' . $name;
      if (!$this->database->schema()->tableExists($table)) {
        continue;
      }

      $count = (int) $this->database->select($table, 't')
        ->countQuery()
        ->execute()
        ->fetchField();

      if ($count === 0) {
        $empty[$name] = [
          'name'        => $name,
          'type'        => $storage->getType(),
          'entity_type' => $entity_type,
        ];
      }
    }

    return $empty;
  }

}
