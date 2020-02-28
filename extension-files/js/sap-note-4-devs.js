'use strict'
function copyToClipboard(element) {
  var text = $(element).clone().find('br').prepend('\r\n').end().text();
  element = $('<textarea class="toClipboard">').appendTo('body').val(text).select();
  document.execCommand('copy');
  element.remove();
}

$( document ).ready(function() {
    $('body').addClass('mybody');
    let oCiCollection = new ciCollection();
    // Prism.highlightAll();
});