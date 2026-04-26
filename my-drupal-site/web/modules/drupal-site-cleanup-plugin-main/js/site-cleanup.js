(function ($, Drupal) {
  'use strict';

  Drupal.behaviors.siteCleanup = {
    attach: function (context, settings) {

      $('[data-sc-select-all]', context).once('sc-sel').on('click', function (e) {
        e.preventDefault();
        var group = $(this).data('sc-select-all');
        $('input[type="checkbox"][name^="' + group + '"]').prop('checked', true);
      });

      $('[data-sc-deselect-all]', context).once('sc-desel').on('click', function (e) {
        e.preventDefault();
        var group = $(this).data('sc-deselect-all');
        $('input[type="checkbox"][name^="' + group + '"]').prop('checked', false);
      });

      $('[data-sc-confirm]', context).once('sc-conf').on('click', function (e) {
        if (!window.confirm($(this).data('sc-confirm'))) {
          e.preventDefault();
        }
      });

    }
  };

}(jQuery, Drupal));
