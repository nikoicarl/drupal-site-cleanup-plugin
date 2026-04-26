<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Extension\ModuleHandlerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Wraps entity_usage so scanners can use it when available.
 *
 * When entity_usage is not installed every method returns an empty array,
 * which causes the scanners to fall back to their built-in field-table scan.
 */
class EntityUsageBridge {

  /**
   * @var bool
   */
  protected $available;

  /**
   * @var \Drupal\entity_usage\EntityUsageInterface|null
   */
  protected $entityUsage;

  /**
   * EntityUsageBridge constructor.
   */
  public function __construct(ModuleHandlerInterface $moduleHandler, ContainerInterface $container) {
    $this->available = $moduleHandler->moduleExists('entity_usage');

    if ($this->available && $container->has('entity_usage.usage')) {
      $this->entityUsage = $container->get('entity_usage.usage');
    }
    else {
      $this->available  = FALSE;
      $this->entityUsage = NULL;
    }
  }

  /**
   * Returns TRUE when entity_usage is installed and its service is available.
   *
   * @return bool
   */
  public function isAvailable(): bool {
    return $this->available;
  }

  /**
   * Returns all sources that reference a given entity.
   *
   * Delegates to EntityUsageInterface::listSources() when available.
   * Returns an empty array when entity_usage is not installed, which tells
   * the caller to fall back to its own field-table scan.
   *
   * @param string $entity_type
   *   The entity type machine name, e.g. 'node'.
   * @param int    $entity_id
   *   The entity ID.
   *
   * @return array
   *   Array of source records, or empty if entity_usage is not available.
   */
  public function listSources(string $entity_type, int $entity_id): array {
    if (!$this->available || $this->entityUsage === NULL) {
      return [];
    }

    try {
      // entity_usage >= 2.x API: listSources($target_entity)
      // Load the entity and pass it, or fall back to the older array-based API.
      $storage = \Drupal::entityTypeManager()->getStorage($entity_type);
      $entity  = $storage->load($entity_id);

      if (!$entity) {
        return [];
      }

      // Try the Drupal 9/10 compatible API first (2.x branch).
      if (method_exists($this->entityUsage, 'listSources')) {
        $sources = $this->entityUsage->listSources($entity);
        // listSources returns a nested array keyed by source_type > source_id.
        // A non-empty result means the entity is referenced somewhere.
        return is_array($sources) ? $sources : [];
      }

      // Fallback for entity_usage 1.x (Drupal 8): listUsage($entity).
      if (method_exists($this->entityUsage, 'listUsage')) {
        $usage = $this->entityUsage->listUsage($entity);
        return is_array($usage) ? $usage : [];
      }
    }
    catch (\Exception $e) {
      // Any error from entity_usage should not break the page.
    }

    return [];
  }

  /**
   * Returns TRUE when the given entity has at least one source reference.
   *
   * @param string $entity_type
   * @param int    $entity_id
   *
   * @return bool
   *   TRUE if referenced, FALSE if not referenced OR if entity_usage is absent.
   */
  public function isReferenced(string $entity_type, int $entity_id): bool {
    $sources = $this->listSources($entity_type, $entity_id);
    return !empty($sources);
  }

}
