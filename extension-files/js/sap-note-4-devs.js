'use strict'
const replaceAll = (string, needle, replace) => {
	return string.replace(new RegExp(escapeRegExp(needle), 'gi'), replace);
}
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const copyToClipboard = (element) => {
  var text = $(element).clone().find('br').prepend('\r\n').end().text();
  element = $('<textarea class="toClipboard">').appendTo('body').val(text).select();
  document.execCommand('copy');
  element.remove();
}

const adjustGeneralHtml = () => {
  $('body').addClass('mybody');
  $('#Display_Container').removeAttr("style");
}

$( document ).ready(function() {
    adjustGeneralHtml();
    let osettingsSync = new settingsSync();
    let oCiCollection = undefined;
    osettingsSync.loadSettings(function(settings){
      oCiCollection = new ciCollection(settings);
      Prism.highlightAll();
      oCiCollection.highlight();
    });
});