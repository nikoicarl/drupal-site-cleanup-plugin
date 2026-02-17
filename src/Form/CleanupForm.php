<?php

namespace Drupal\site_cleanup\Form;

use Drupal\block\Entity\Block;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\file\Entity\File;
use Drupal\media\Entity\Media;
use Drupal\node\Entity\Node;
use Drupal\site_cleanup\Service\BlockScanner;
use Drupal\site_cleanup\Service\ContentScanner;
use Drupal\site_cleanup\Service\EntityUsageBridge;
use Drupal\site_cleanup\Service\FieldScanner;
use Drupal\site_cleanup\Service\FileScanner;
use Drupal\site_cleanup\Service\MediaScanner;
use Drupal\site_cleanup\Service\MenuScanner;
use Drupal\site_cleanup\Service\ModuleScanner;
use Drupal\site_cleanup\Service\ParagraphScanner;
use Drupal\site_cleanup\Service\TaxonomyScanner;
use Drupal\site_cleanup\Service\UserScanner;
use Drupal\site_cleanup\Service\ViewScanner;
use Drupal\taxonomy\Entity\Term;
use Drupal\views\Entity\View;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Main Site Cleanup administration form.
 */
class CleanupForm extends FormBase {

  /** @var FileScanner */      protected $fileScanner;
  /** @var FieldScanner */     protected $fieldScanner;
  /** @var ModuleScanner */    protected $moduleScanner;
  /** @var ViewScanner */      protected $viewScanner;
  /** @var ContentScanner */   protected $contentScanner;
  /** @var BlockScanner */     protected $blockScanner;
  /** @var TaxonomyScanner */  protected $taxonomyScanner;
  /** @var MediaScanner */     protected $mediaScanner;
  /** @var ParagraphScanner */ protected $paragraphScanner;
  /** @var MenuScanner */      protected $menuScanner;
  /** @var UserScanner */      protected $userScanner;
  /** @var EntityUsageBridge */protected $entityUsage;

  /**
   * CleanupForm constructor.
   */
  public function __construct(
    FileScanner $fileScanner,
    FieldScanner $fieldScanner,
    ModuleScanner $moduleScanner,
    ViewScanner $viewScanner,
    ContentScanner $contentScanner,
    BlockScanner $blockScanner,
    TaxonomyScanner $taxonomyScanner,
    MediaScanner $mediaScanner,
    ParagraphScanner $paragraphScanner,
    MenuScanner $menuScanner,
    UserScanner $userScanner,
    EntityUsageBridge $entityUsage
  ) {
    $this->fileScanner      = $fileScanner;
    $this->fieldScanner     = $fieldScanner;
    $this->moduleScanner    = $moduleScanner;
    $this->viewScanner      = $viewScanner;
    $this->contentScanner   = $contentScanner;
    $this->blockScanner     = $blockScanner;
    $this->taxonomyScanner  = $taxonomyScanner;
    $this->mediaScanner     = $mediaScanner;
    $this->paragraphScanner = $paragraphScanner;
    $this->menuScanner      = $menuScanner;
    $this->userScanner      = $userScanner;
    $this->entityUsage      = $entityUsage;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('site_cleanup.file_scanner'),
      $container->get('site_cleanup.field_scanner'),
      $container->get('site_cleanup.module_scanner'),
      $container->get('site_cleanup.view_scanner'),
      $container->get('site_cleanup.content_scanner'),
      $container->get('site_cleanup.block_scanner'),
      $container->get('site_cleanup.taxonomy_scanner'),
      $container->get('site_cleanup.media_scanner'),
      $container->get('site_cleanup.paragraph_scanner'),
      $container->get('site_cleanup.menu_scanner'),
      $container->get('site_cleanup.user_scanner'),
      $container->get('site_cleanup.entity_usage_bridge')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'site_cleanup_form';
  }

  // ---------------------------------------------------------------------------
  // Form build
  // ---------------------------------------------------------------------------

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['#attached']['library'][] = 'site_cleanup/admin';
    $form['#attributes']['class'][] = 'site-cleanup-wrap';

    $eu_active = $this->entityUsage->isAvailable();

    // Run all scans.
    $unused_images   = $this->fileScanner->getUnusedImages();
    $unused_files    = $this->fileScanner->getUnusedFiles();
    $unused_views    = $this->viewScanner->getUnusedViews();
    $orphaned_nodes  = $this->contentScanner->getOrphanedNodes();
    $stale_nodes     = $this->contentScanner->getStaleUnpublishedNodes();
    $unplaced_blocks = $this->blockScanner->getUnplacedBlocks();
    $unused_media    = $this->mediaScanner->getUnusedMedia();
    $unused_terms    = $this->taxonomyScanner->getUnusedTerms();
    $orphaned_paras  = $this->paragraphScanner->getOrphanedParagraphs();
    $broken_links    = $this->menuScanner->getBrokenMenuLinks();
    $blocked_users   = $this->userScanner->getBlockedUsers();
    $empty_fields    = $this->fieldScanner->getEmptyFields();
    $contrib_modules = $this->moduleScanner->getEnabledContribModules();
    $total_bytes     = $this->fileScanner->unusedTotalBytes();

    // entity_usage status notice.
    if ($eu_active) {
      $eu_html = '<div class="sc-notice sc-notice-info">'
        . '<strong>entity_usage is active.</strong> Reference detection is using the entity usage tracking table for accurate results.'
        . '</div>';
    }
    else {
      $eu_html = '<div class="sc-notice sc-notice-warning">'
        . '<strong>entity_usage is not installed.</strong> Reference detection is falling back to field-table scanning, which may be less accurate. '
        . 'Install <a href="https://www.drupal.org/project/entity_usage" target="_blank">entity_usage</a> for better results.'
        . '</div>';
    }
    $form['eu_notice'] = ['#markup' => $eu_html];

    // Summary strip.
    $form['summary'] = $this->buildSummary([
      'Unused images'    => count($unused_images),
      'Unused files'     => count($unused_files),
      'Unused views'     => count($unused_views),
      'Orphaned nodes'   => count($orphaned_nodes),
      'Unplaced blocks'  => count($unplaced_blocks),
      'Disk recoverable' => format_size($total_bytes),
    ]);

    // Backup reminder.
    $form['notice'] = [
      '#markup' => '<div class="sc-notice sc-notice-warning">'
        . '<strong>Before you delete anything:</strong> take a database backup. Deletions are permanent.'
        . '</div>',
    ];

    // Sections.
    $form['sec_views']    = $this->sectionViews($unused_views);
    $form['sec_content']  = $this->sectionOrphanedContent($orphaned_nodes);
    $form['sec_stale']    = $this->sectionStaleContent($stale_nodes);
    $form['sec_blocks']   = $this->sectionBlocks($unplaced_blocks);
    $form['sec_media']    = $this->sectionMedia($unused_media);
    $form['sec_taxonomy'] = $this->sectionTaxonomy($unused_terms);
    $form['sec_paras']    = $this->sectionParagraphs($orphaned_paras);
    $form['sec_menus']    = $this->sectionMenuLinks($broken_links);
    $form['sec_users']    = $this->sectionUsers($blocked_users);
    $form['sec_images']   = $this->sectionImages($unused_images);
    $form['sec_files']    = $this->sectionFiles($unused_files);
    $form['sec_fields']   = $this->sectionFields($empty_fields);
    $form['sec_modules']  = $this->sectionModules($contrib_modules);

    return $form;
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  /**
   * Builds the summary cards strip.
   */
  protected function buildSummary(array $items): array {
    $html = '<div class="sc-summary">';
    foreach ($items as $label => $value) {
      $num_class = (is_int($value) && $value > 0) ? 'sc-card-num has-items' : 'sc-card-num';
      $html .= '<div class="sc-card">'
        . '<span class="' . $num_class . '">' . $value . '</span>'
        . '<span class="sc-card-label">' . $label . '</span>'
        . '</div>';
    }
    $html .= '</div>';
    return ['#markup' => $html];
  }

  // ---------------------------------------------------------------------------
  // Section builders
  // ---------------------------------------------------------------------------

  protected function sectionViews(array $items): array {
    $s = $this->openSection('Unused Views', count($items),
      'Views with no active page, block, feed, or embed display.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $id => $d) {
      $rows[] = [$d['label'], $id, $d['display_count'], $this->checkbox('delete_views', $id)];
    }
    $s['table'] = $this->buildTable(['Label', 'Machine name', 'Displays', ''], $rows);
    $s['acts']  = $this->actionBar('delete_views', '::deleteViews', 'Delete selected views');
    return $s;
  }

  protected function sectionOrphanedContent(array $items): array {
    $s = $this->openSection('Orphaned Content', count($items),
      'Nodes not referenced by other entities, menu links, or view pages.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $nid => $d) {
      $rows[] = [$d['title'], $d['type'], $nid, date('Y-m-d', $d['created']), $this->checkbox('delete_content', $nid)];
    }
    $s['table'] = $this->buildTable(['Title', 'Type', 'NID', 'Created', ''], $rows);
    $s['acts']  = $this->actionBar('delete_content', '::deleteContent', 'Delete selected');
    return $s;
  }

  protected function sectionStaleContent(array $items): array {
    $s = $this->openSection('Stale Unpublished Content', count($items),
      'Unpublished nodes not edited in 90 or more days.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $nid => $d) {
      $rows[] = [$d['title'], $d['type'], $d['days_old'] . ' days', $this->checkbox('delete_stale', $nid)];
    }
    $s['table'] = $this->buildTable(['Title', 'Type', 'Days old', ''], $rows);
    $s['acts']  = $this->actionBar('delete_stale', '::deleteStale', 'Delete selected');
    return $s;
  }

  protected function sectionBlocks(array $items): array {
    $s = $this->openSection('Unplaced Blocks', count($items),
      'Block config entities that are disabled or belong to an inactive theme.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $id => $d) {
      $rows[] = [$d['label'], $id, $d['theme'], $d['region'], $this->checkbox('delete_blocks', $id)];
    }
    $s['table'] = $this->buildTable(['Label', 'ID', 'Theme', 'Region', ''], $rows);
    $s['acts']  = $this->actionBar('delete_blocks', '::deleteBlocks', 'Delete selected');
    return $s;
  }

  protected function sectionMedia(array $items): array {
    $s = $this->openSection('Unused Media', count($items),
      'Media entities not referenced in any content.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $mid => $d) {
      $rows[] = [$d['name'], $d['bundle'], date('Y-m-d', $d['created']), $this->checkbox('delete_media', $mid)];
    }
    $s['table'] = $this->buildTable(['Name', 'Bundle', 'Created', ''], $rows);
    $s['acts']  = $this->actionBar('delete_media', '::deleteMedia', 'Delete selected');
    return $s;
  }

  protected function sectionTaxonomy(array $items): array {
    $s = $this->openSection('Unused Taxonomy Terms', count($items),
      'Terms not used in any content on the site.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $tid => $d) {
      $rows[] = [$d['name'], $d['vocabulary'], $this->checkbox('delete_terms', $tid)];
    }
    $s['table'] = $this->buildTable(['Term', 'Vocabulary', ''], $rows);
    $s['acts']  = $this->actionBar('delete_terms', '::deleteTerms', 'Delete selected');
    return $s;
  }

  protected function sectionParagraphs(array $items): array {
    $s = $this->openSection('Orphaned Paragraphs', count($items),
      'Paragraph entities not attached to any parent.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $id => $d) {
      $rows[] = [$id, $d['type'], date('Y-m-d', $d['created']), $this->checkbox('delete_paragraphs', $id)];
    }
    $s['table'] = $this->buildTable(['ID', 'Type', 'Created', ''], $rows);
    $s['acts']  = $this->actionBar('delete_paragraphs', '::deleteParagraphs', 'Delete selected');
    return $s;
  }

  protected function sectionMenuLinks(array $items): array {
    $s = $this->openSection('Broken Menu Links', count($items),
      'Menu links pointing to nodes that have been deleted.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $id => $d) {
      $rows[] = [$d['title'], $d['menu'], $d['uri'], $this->checkbox('delete_menu_links', $id)];
    }
    $s['table'] = $this->buildTable(['Title', 'Menu', 'URI', ''], $rows);
    $s['acts']  = $this->actionBar('delete_menu_links', '::deleteMenuLinks', 'Delete selected');
    return $s;
  }

  protected function sectionUsers(array $items): array {
    $s = $this->openSection('Blocked Users', count($items),
      'User accounts with blocked status.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $uid => $d) {
      $rows[] = [$d['name'], $d['email'], date('Y-m-d', $d['created']), $this->checkbox('delete_users', $uid)];
    }
    $s['table'] = $this->buildTable(['Username', 'Email', 'Created', ''], $rows);
    $s['acts']  = $this->actionBar('delete_users', '::deleteUsers', 'Delete selected');
    return $s;
  }

  protected function sectionImages(array $items): array {
    $total = 0;
    foreach ($items as $d) {
      $total += (int) $d['size'];
    }
    $s = $this->openSection('Unused Images', count($items),
      'Image files in file_managed with no usage records. Total size: ' . format_size($total));
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $fid => $d) {
      $rows[] = [$fid, $d['uri'], format_size($d['size']), $this->checkbox('delete_images', $fid)];
    }
    $s['table'] = $this->buildTable(['FID', 'URI', 'Size', ''], $rows);
    $s['acts']  = $this->actionBar('delete_images', '::deleteImages', 'Delete selected');
    return $s;
  }

  protected function sectionFiles(array $items): array {
    $total = 0;
    foreach ($items as $d) {
      $total += (int) $d['size'];
    }
    $s = $this->openSection('Unused Files', count($items),
      'Non-image managed files with no usage records. Total size: ' . format_size($total));
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $fid => $d) {
      $rows[] = [$fid, $d['uri'], $d['mime'], format_size($d['size']), $this->checkbox('delete_files', $fid)];
    }
    $s['table'] = $this->buildTable(['FID', 'URI', 'MIME', 'Size', ''], $rows);
    $s['acts']  = $this->actionBar('delete_files', '::deleteFiles', 'Delete selected');
    return $s;
  }

  protected function sectionFields(array $items): array {
    $s = $this->openSection('Empty Fields', count($items),
      'Custom fields with no data. Remove these via the field UI if they are no longer needed.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $d) {
      $rows[] = [$d['name'], $d['type'], $d['entity_type']];
    }
    $s['table'] = $this->buildTable(['Field name', 'Type', 'Entity type'], $rows);
    $s['close'] = ['#markup' => '</div></div>'];
    return $s;
  }

  protected function sectionModules(array $items): array {
    $s = $this->openSection('Enabled Contrib Modules', count($items),
      'Non-core modules currently enabled. Uninstall any that are no longer required.');
    if (empty($items)) {
      return $s + $this->emptyState();
    }
    $rows = [];
    foreach ($items as $name => $d) {
      $rows[] = [$name, $d['package']];
    }
    $s['table'] = $this->buildTable(['Module', 'Package'], $rows);
    $s['close'] = ['#markup' => '</div></div>'];
    return $s;
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  protected function openSection(string $title, int $count, string $description): array {
    if ($count === 0) {
      $badge = 'sc-badge none';
    }
    elseif ($count <= 20) {
      $badge = 'sc-badge low';
    }
    else {
      $badge = 'sc-badge high';
    }

    $markup = '<div class="sc-section">'
      . '<div class="sc-section-head">'
      . '<h3 class="sc-section-title">' . $title . '</h3>'
      . '<span class="' . $badge . '">' . $count . '</span>'
      . '</div>'
      . '<div class="sc-section-body">'
      . '<p class="sc-description">' . $description . '</p>';

    return [
      '#type'       => 'container',
      '#attributes' => [],
      'head'        => ['#markup' => $markup],
    ];
  }

  protected function emptyState(): array {
    return [
      'empty' => ['#markup' => '<div class="sc-empty">Nothing found</div></div></div>'],
    ];
  }

  protected function buildTable(array $header, array $rows): array {
    return [
      '#type'       => 'table',
      '#header'     => $header,
      '#rows'       => $rows,
      '#attributes' => ['class' => ['sc-table']],
    ];
  }

  protected function checkbox(string $group, $id): array {
    return [
      'data' => [
        '#type'       => 'checkbox',
        '#name'       => $group . '[' . $id . ']',
        '#attributes' => ['class' => ['sc-check']],
      ],
    ];
  }

  protected function actionBar(string $group, string $handler, string $label): array {
    return [
      '#type'       => 'container',
      '#attributes' => ['class' => ['sc-actions']],
      '#suffix'     => '</div></div>',
      'btns'        => [
        '#markup' => '<button type="button" class="sc-btn sc-btn-default" data-sc-select-all="' . $group . '">Select all</button> '
          . '<button type="button" class="sc-btn sc-btn-default" data-sc-deselect-all="' . $group . '">Deselect all</button> ',
      ],
      'submit'      => [
        '#type'       => 'submit',
        '#value'      => $this->t($label),
        '#submit'     => [$handler],
        '#attributes' => [
          'class'           => ['sc-btn', 'sc-btn-danger'],
          'data-sc-confirm' => 'Delete the selected items? This cannot be undone.',
        ],
      ],
    ];
  }

  // ---------------------------------------------------------------------------
  // Submit handlers
  // ---------------------------------------------------------------------------

  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Each section has its own targeted handler.
  }

  public function deleteViews(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_views'] ?? []);
    foreach (array_keys($selected) as $id) {
      $entity = View::load($id);
      if ($entity) {
        $entity->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n view(s).', ['@n' => count($selected)]));
  }

  public function deleteContent(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_content'] ?? []);
    foreach (array_keys($selected) as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $node->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n node(s).', ['@n' => count($selected)]));
  }

  public function deleteStale(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_stale'] ?? []);
    foreach (array_keys($selected) as $nid) {
      $node = Node::load($nid);
      if ($node) {
        $node->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n node(s).', ['@n' => count($selected)]));
  }

  public function deleteBlocks(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_blocks'] ?? []);
    foreach (array_keys($selected) as $id) {
      $entity = Block::load($id);
      if ($entity) {
        $entity->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n block(s).', ['@n' => count($selected)]));
  }

  public function deleteMedia(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_media'] ?? []);
    foreach (array_keys($selected) as $mid) {
      $media = Media::load($mid);
      if ($media) {
        $media->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n media item(s).', ['@n' => count($selected)]));
  }

  public function deleteTerms(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_terms'] ?? []);
    foreach (array_keys($selected) as $tid) {
      $term = Term::load($tid);
      if ($term) {
        $term->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n term(s).', ['@n' => count($selected)]));
  }

  public function deleteParagraphs(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_paragraphs'] ?? []);
    $storage  = \Drupal::entityTypeManager()->getStorage('paragraph');
    foreach (array_keys($selected) as $pid) {
      $entity = $storage->load($pid);
      if ($entity) {
        $entity->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n paragraph(s).', ['@n' => count($selected)]));
  }

  public function deleteMenuLinks(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_menu_links'] ?? []);
    $storage  = \Drupal::entityTypeManager()->getStorage('menu_link_content');
    foreach (array_keys($selected) as $id) {
      $entity = $storage->load($id);
      if ($entity) {
        $entity->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n menu link(s).', ['@n' => count($selected)]));
  }

  public function deleteUsers(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_users'] ?? []);
    $storage  = \Drupal::entityTypeManager()->getStorage('user');
    foreach (array_keys($selected) as $uid) {
      if ((int) $uid === 1) {
        continue;
      }
      $user = $storage->load($uid);
      if ($user) {
        $user->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n user(s).', ['@n' => count($selected)]));
  }

  public function deleteImages(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_images'] ?? []);
    foreach (array_keys($selected) as $fid) {
      $file = File::load($fid);
      if ($file) {
        $file->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n image file(s).', ['@n' => count($selected)]));
  }

  public function deleteFiles(array &$form, FormStateInterface $form_state) {
    $selected = array_filter($form_state->getUserInput()['delete_files'] ?? []);
    foreach (array_keys($selected) as $fid) {
      $file = File::load($fid);
      if ($file) {
        $file->delete();
      }
    }
    $this->messenger()->addStatus($this->t('Deleted @n file(s).', ['@n' => count($selected)]));
  }

}
