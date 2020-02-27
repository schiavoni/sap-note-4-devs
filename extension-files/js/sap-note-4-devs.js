'use strict'
$( document ).ready(function() {
    $('body').addClass('mybody');

    Prism.highlightAll();
    let oCiCollection = new ciCollection();
    console.log(oCiCollection.arrCi);
});