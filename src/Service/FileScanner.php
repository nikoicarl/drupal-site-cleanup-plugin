<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Locates managed files that have no usage records in file_usage.
 */
class FileScanner {

  /**
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * FileScanner constructor.
   */
  public function __construct(Connection $database, EntityTypeManagerInterface $entityTypeManager) {
    $this->database          = $database;
    $this->entityTypeManager = $entityTypeManager;
  }

  /**
   * Returns unused image files (mime type starts with "image/").
   *
   * @return array
   *   Keyed by fid. Each value: uri, mime, size, created.
   */
  public function getUnusedImages(): array {
    return $this->fetchUnused(TRUE);
  }

  /**
   * Returns unused non-image managed files.
   *
   * @return array
   *   Keyed by fid. Each value: uri, mime, size, created.
   */
  public function getUnusedFiles(): array {
    return $this->fetchUnused(FALSE);
  }

  /**
   * Returns the combined byte size of all unused files.
   *
   * @return int
   */
  public function unusedTotalBytes(): int {
    $total = 0;
    foreach (array_merge($this->getUnusedImages(), $this->getUnusedFiles()) as $f) {
      $total += (int) $f['size'];
    }
    return $total;
  }

  /**
   * Fetches unused files filtered by image / non-image.
   */
  protected function fetchUnused(bool $images_only): array {
    $results = [];

    $files = $this->database->select('file_managed', 'f')
      ->fields('f', ['fid', 'uri', 'filemime', 'filesize', 'created'])
      ->execute()
      ->fetchAll();

    foreach ($files as $file) {
      $is_image = strpos($file->filemime, 'image/') === 0;
      if ($images_only && !$is_image) {
        continue;
      }
      if (!$images_only && $is_image) {
        continue;
      }

      $used = (int) $this->database->select('file_usage', 'fu')
        ->condition('fid', $file->fid)
        ->countQuery()
        ->execute()
        ->fetchField();

      if ($used === 0) {
        $results[$file->fid] = [
          'uri'     => $file->uri,
          'mime'    => $file->filemime,
          'size'    => $file->filesize,
          'created' => $file->created,
        ];
      }
    }

    return $results;
  }

}
