<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Finds menu links pointing to nodes that no longer exist.
 */
class MenuScanner {

  /**
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * MenuScanner constructor.
   */
  public function __construct(EntityTypeManagerInterface $entityTypeManager) {
    $this->entityTypeManager = $entityTypeManager;
  }

  /**
   * Returns menu_link_content entities whose target node no longer exists.
   *
   * @return array
   *   Keyed by link id. Each value: id, title, menu, uri.
   */
  public function getBrokenMenuLinks(): array {
    $broken       = [];
    $node_storage = $this->entityTypeManager->getStorage('node');

    foreach ($this->entityTypeManager->getStorage('menu_link_content')->loadMultiple() as $id => $link) {
      $uri = isset($link->link->uri) ? $link->link->uri : '';

      if (strpos($uri, 'entity:node/') !== 0) {
        continue;
      }

      $nid = substr($uri, strlen('entity:node/'));
      if ($nid && !$node_storage->load($nid)) {
        $broken[$id] = [
          'id'    => $id,
          'title' => $link->getTitle(),
          'menu'  => $link->getMenuName(),
          'uri'   => $uri,
        ];
      }
    }

    return $broken;
  }

}
