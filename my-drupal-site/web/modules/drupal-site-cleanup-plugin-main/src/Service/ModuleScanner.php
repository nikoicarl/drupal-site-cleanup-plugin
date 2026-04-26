<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Extension\InfoParserInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;

/**
 * Lists enabled non-core modules.
 */
class ModuleScanner {

  /**
   * @var \Drupal\Core\Extension\ModuleHandlerInterface
   */
  protected $moduleHandler;

  /**
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * @var \Drupal\Core\Extension\InfoParserInterface
   */
  protected $infoParser;

  /**
   * ModuleScanner constructor.
   */
  public function __construct(ModuleHandlerInterface $moduleHandler, Connection $database, InfoParserInterface $infoParser) {
    $this->moduleHandler = $moduleHandler;
    $this->database      = $database;
    $this->infoParser    = $infoParser;
  }

  /**
   * Returns all enabled non-core modules, sorted by machine name.
   *
   * @return array
   *   Keyed by machine name. Each value: name, package.
   */
  public function getEnabledContribModules(): array {
    $modules = [];

    foreach ($this->moduleHandler->getModuleList() as $name => $extension) {
      if (strpos($extension->getPath(), 'core/') === 0) {
        continue;
      }

      $info_file = $extension->getPathname();
      $package   = 'Other';

      if (file_exists($info_file)) {
        try {
          $info    = $this->infoParser->parse($info_file);
          $package = isset($info['package']) ? $info['package'] : 'Other';
        }
        catch (\Exception $e) {
          // Malformed info file.
        }
      }

      $modules[$name] = [
        'name'    => $name,
        'package' => $package,
      ];
    }

    ksort($modules);
    return $modules;
  }

}
