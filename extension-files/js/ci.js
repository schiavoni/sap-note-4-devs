class correctionInstruction {
    constructor(domEl, ciNumber){
        this.number = ciNumber;
        this.text = domEl.innerHTML;
        this.header = undefined;
        this.requirements = undefined;
        this.releases = undefined;
        this.prettyHtml = undefined;
        this.jqueryObj = $(domEl);
        this.locked = (this.text.length > 999999);
        this.divisor = '*$--------------------------------------------------------------------$*';
        this.headerDivisor = '*$*$----------------------------------------------------------------$*$*';
        this.init();
    }
    getFromHeader(regex){
        let container = new Array();
        let matches = this.header.matchAll(regex);
        for(let match of matches) {
            container.push(match[2]);
        }
        return container;
    }
    chopHeader(){
        this.header = '';
        let indexStart = this.text.indexOf(this.headerDivisor);
        if(indexStart > -1){
            this.header = this.text.substr(indexStart, this.text.indexOf(this.headerDivisor, indexStart + this.headerDivisor.length) - indexStart);
            this.text = this.text.substr(this.header.length + (2 * this.headerDivisor.length) );
            this.header = this.header.replace(/\&nbsp/gi,' ');
        }
    }
    getRequirements(){
        this.requirements = this.getFromHeader(/(Note|Hinweis){1}(?:\s){1}([0-9]{10})/gmi);
    }
    getReleases(){
        this.releases = this.getFromHeader(/(Release )(\S+)/gmi);
    }
    wrapCiBlock(){
        this.jqueryObj.wrap('<div class="ciBlock"><pre class="language-abap"><code></code></pre></div>');
        
        if(this.locked)
            this.jqueryObj.html(this.jqueryObj.html().substr(0, 6000));
        
        this.jqueryObj = this.jqueryObj.closest('.ciBlock');

        if(this.locked)
            this.jqueryObj.addClass('locked');
    }
    compareRequirements(arrCiWithoutMe){
        let html = '';
        for(let req of this.requirements){
            let leftZeroLeadingReq = req.replace(/^0+/,'');
            let htmlClass = 'compare-status-not-comparable';
            for(let ci of arrCiWithoutMe){
                htmlClass = 'compare-status-equal';
                if(ci.requirements.indexOf(req) == -1){
                    htmlClass = 'compare-status-different';
                    break;
                }
            }
            html += '<a class="'+htmlClass+'" href="https://i7p.wdf.sap.corp/sap/support/notes/'+leftZeroLeadingReq+'" target="_blank">'+leftZeroLeadingReq+'</a> ';
        }
        return html;
    }
    compareText(arrCiWithoutMe){
        let html = '<small class="compare-status-not-comparable">Not comparable</small>';
        for(let ci of arrCiWithoutMe){
            html = '<small class="compare-status-equal">Equal to all CIs</small>';
            if(this.text != ci.text){
                html = '<small class="compare-status-different">Different of at least one</small>';
                break;
            }
        }
        return html;
    }
    copyCiTextToClipboard(){
        copyToClipboard(this.jqueryObj.find('pre.language-abap>code'));
    }
    buildCiInfo(arrCi){
        let me = this;
        let arrCiWithoutMe = new Array();
        let textComparison = '<h4>Code: <small class="compare-status-not-comparable">Too big to compare. Code truncated.</small></h4>';
        let copyToClipboard = $('<a class="toClipboard" href="javascript:">Copy CI code to clipboard</a>');
        copyToClipboard.on('click', function(){me.copyCiTextToClipboard()});
        for(let ci of arrCi)
            if(ci.number != this.number)
                arrCiWithoutMe.push(ci);

        if(!this.locked)
            textComparison = '<h4>Code: '+this.compareText(arrCiWithoutMe)+'</h4>';
            
        this.jqueryObj.prepend('<div class="ciInfo">'+
            '<h4>Releases: '+this.releases.join(', ')+'</h4>'+
            '<h4>Requirement notes: '+this.compareRequirements(arrCiWithoutMe)+'</h4>'+
            textComparison+
        '</div>');
        this.jqueryObj.find('.ciInfo').append(copyToClipboard);
    }
    normalizeSyntax(){
        let code = this.jqueryObj.find('code');
        let htmlCode = code.html();
        htmlCode = replaceAll(htmlCode, '<br>', '\n');
        htmlCode = replaceAll(htmlCode,	'*\n&gt;&gt;&gt;', '*\n</code><code class="language-none">&gt;&gt;&gt;');
        htmlCode = replaceAll(htmlCode,	'&lt;&lt;&lt;\n\n*&amp;', '&lt;&lt;&lt;</code><code class="language-abap">\n\n*&amp;');
        code.html(htmlCode);
    }
    syntaxHighlighter(){
        let htmlCode = this.jqueryObj.html();

        htmlCode = replaceAll(htmlCode,	
            '<span class="token comment">*&gt;&gt;&gt;&gt; START OF DELETION &lt;&lt;&lt;&lt;', 
            '<div class="deletionBlock"><span class="token comment"><b>*&gt;&gt;&gt;&gt; START OF DELETION &lt;&lt;&lt;&lt;&lt;</b>');
        htmlCode = replaceAll(htmlCode,	
            '*&gt;&gt;&gt;&gt; END OF DELETION &lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>', 
            '<b>*&gt;&gt;&gt;&gt; END OF DELETION &lt;&lt;&lt;&lt;&lt;&lt;&lt;</b></span></div>');

        htmlCode = replaceAll(htmlCode,	
            '<span class="token comment">*&gt;&gt;&gt;&gt; START OF INSERTION &lt;&lt;&lt;&lt;', 
            '<div class="insertionBlock"><span class="token comment"><b>*&gt;&gt;&gt;&gt; START OF INSERTION &lt;&lt;&lt;&lt;&lt;</b>');
        htmlCode = replaceAll(htmlCode,	
            '*&gt;&gt;&gt;&gt; END OF INSERTION &lt;&lt;&lt;&lt;&lt;&lt;</span>', 
            '<b>*&gt;&gt;&gt;&gt; END OF INSERTION &lt;&lt;&lt;&lt;&lt;&lt;</b></span></div>');

        this.jqueryObj.html(htmlCode);
    }
    init(){
        this.chopHeader();
        this.getRequirements();
        this.getReleases();
        this.wrapCiBlock();
        this.normalizeSyntax();
    }
}

class ciCollection {
    constructor() {
        this.arrCi = new Array();
        this.jqueryObj = undefined;
        this.discoverCis();
        this.buildCisInfo();
        this.findCollection();
        this.setCollectionStyle();
    }
    discoverCis() {
        let me = this;
        $('div.urTxtStd > p').each(function(index, domEl) {
            let t = domEl.innerHTML;
            if(t.indexOf('Correction Inst.') >= 0 || t.indexOf('KORREKTURANLEITUNG') >= 0) {
                me.arrCi.push(new correctionInstruction(domEl, me.arrCi.length));
            }
        });
    }
    buildCisInfo(){
        for(let ci of this.arrCi){
            ci.buildCiInfo(this.arrCi);
        }
    }
    findCollection(){
        if(this.arrCi.length > 0){
            this.jqueryObj = this.arrCi[0].jqueryObj.parent();
        }
    }
    setCollectionStyle(){
        if(this.jqueryObj != undefined){
            switch(this.arrCi.length){
                case 1:
                case 2:
                case 3:
                        this.jqueryObj.addClass('ciCollection ciCollection-'+this.arrCi.length);
                    break;
                default:
                        this.jqueryObj.addClass('ciCollection ciCollection-tops');
                    break;
            }
        }
    }
    highlight(){
        for(let ci of this.arrCi){
            ci.syntaxHighlighter();
        }
    }
}