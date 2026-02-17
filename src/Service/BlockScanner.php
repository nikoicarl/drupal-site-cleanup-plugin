<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ThemeHandlerInterface;

/**
 * Finds block config entities that are disabled or belong to an inactive theme.
 */
class BlockScanner {

  /**
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * @var \Drupal\Core\Extension\ThemeHandlerInterface
   */
  protected $themeHandler;

  /**
   * BlockScanner constructor.
   */
  public function __construct(EntityTypeManagerInterface $entityTypeManager, ThemeHandlerInterface $themeHandler) {
    $this->entityTypeManager = $entityTypeManager;
    $this->themeHandler      = $themeHandler;
  }

  /**
   * Returns blocks that are disabled or whose theme is no longer active.
   *
   * @return array
   *   Keyed by block id. Each value: id, label, theme, region, plugin.
   */
  public function getUnplacedBlocks(): array {
    $unplaced      = [];
    $active_themes = array_keys($this->themeHandler->listInfo());

    foreach ($this->entityTypeManager->getStorage('block')->loadMultiple() as $id => $block) {
      $region          = $block->getRegion();
      $theme           = $block->getTheme();
      $disabled_region = empty($region) || $region === 'disabled' || $region === '-1';
      $inactive_theme  = !in_array($theme, $active_themes, TRUE);

      if ($disabled_region || $inactive_theme || !$block->status()) {
        $unplaced[$id] = [
          'id'     => $id,
          'label'  => $block->label(),
          'theme'  => $theme,
          'region' => $region ? $region : '—',
          'plugin' => $block->getPluginId(),
        ];
      }
    }

    return $unplaced;
  }

}
