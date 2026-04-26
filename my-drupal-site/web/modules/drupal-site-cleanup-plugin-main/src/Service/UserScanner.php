<?php

namespace Drupal\site_cleanup\Service;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Finds blocked user accounts.
 */
class UserScanner {

  /**
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * UserScanner constructor.
   */
  public function __construct(EntityTypeManagerInterface $entityTypeManager, Connection $database) {
    $this->entityTypeManager = $entityTypeManager;
    $this->database          = $database;
  }

  /**
   * Returns blocked user accounts, excluding uid 0.
   *
   * @param int $limit
   *
   * @return array
   *   Keyed by uid. Each value: uid, name, email, created.
   */
  public function getBlockedUsers(int $limit = 100): array {
    $blocked = [];

    $uids = $this->database->select('users_field_data', 'u')
      ->fields('u', ['uid'])
      ->condition('status', 0)
      ->condition('uid', 0, '>')
      ->range(0, $limit)
      ->execute()
      ->fetchCol();

    $storage = $this->entityTypeManager->getStorage('user');

    foreach ($uids as $uid) {
      $user = $storage->load($uid);
      if (!$user) {
        continue;
      }
      $blocked[(int) $uid] = [
        'uid'     => $uid,
        'name'    => $user->getAccountName(),
        'email'   => $user->getEmail(),
        'created' => $user->getCreatedTime(),
      ];
    }

    return $blocked;
  }

}
