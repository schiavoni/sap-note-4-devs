class correctionInstruction {
    constructor(domEl, ciNumber, settings, message){
        this.message = message;
        this.settings = settings;
        this.number = ciNumber;
        this.text = domEl.innerHTML;
        this.header = undefined;
        this.requirements = undefined;
        this.releases = undefined;
        this.prettyHtml = undefined;
        this.jqueryObj = $(domEl);
        this.locked = (this.text.length > this.settings.codeTrunctionThreshold);
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
        this.jqueryObj.wrap('<div class="ciBlock"><div class="ciCode"><pre class="language-abap"><code></code></pre></div></div>');
        
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
        copyToClipboard(this.jqueryObj.find('.ciCode:first').html());
    }
    buildCiInfo(arrCi){
        let me = this;
        let arrCiWithoutMe = new Array();
        let textComparison = '<h4>Code: <small class="compare-status-not-comparable">Too big to compare. Code truncated.</small></h4>';
        let copyToClipboard = $('<a class="cibtn toClipboard" href="javascript:">Copy CI code to clipboard</a>');
        copyToClipboard.on('click', function(){ me.copyCiTextToClipboard() });

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
        let codeObj = this.jqueryObj.find('.ciCode:first');
        let htmlCode = codeObj.html();

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

        codeObj.html(htmlCode);
    }
    regexSearches(){
        let arrTest = [ { type:'code', regex:'ated by SAP_LOCAL_DO', message:'This should not be here' },
                        { type:'code', regex:'TYPE ddtext', message:'This should not be here 2' } ];
        let m;
        for (let search of arrTest){
            console.log(search.regex);

            let reg = new RegExp(search.regex, 'gm');
            
            while ((m = reg.exec(this.text)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === reg.lastIndex) {
                    reg.lastIndex++;
                }
                
                // The result can be accessed through the `m`-variable.
                m.forEach((match, groupIndex) => {
                    this.message.warning(`Found match, group ${groupIndex}: ${match}`);
                });
            }
        }
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
    constructor(settings, message) {
        this.settings = settings;
        this.message = message;
        this.arrCi = new Array();
        this.jqueryObj = undefined;
        this.lockScrollOption = undefined;
        this.discoverCis();
        this.buildCisInfo();
        this.findCollection();
        this.setCollectionHeader();
        this.lockScrollToggle();
    }
    discoverCis() {
        let me = this;
        $('div.urTxtStd > p').each(function(index, domEl) {
            let t = domEl.innerHTML;
            if(t.indexOf('Correction Inst.') >= 0 || t.indexOf('KORREKTURANLEITUNG') >= 0) {
                me.arrCi.push(new correctionInstruction(domEl, me.arrCi.length, me.settings, me.message));
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
    lockScrollToggle(){
        let me = this;

        if(me.lockScrollOption === true){

            for(let ci of this.arrCi)
                ci.jqueryObj.find('.ciCode').off( ".lockscroll" );
            
            me.lockScrollOption = false;
            me.jqueryObj.find('a.lockscroll input').prop('checked', false);
        } else {
        
            for(let ciIndex = 0; ciIndex < me.arrCi.length; ciIndex++){
                let currentCiBlock = me.arrCi[ciIndex].jqueryObj.find('.ciCode');

                $(currentCiBlock).on('mouseenter.lockscroll', function(){
                    $(currentCiBlock).on('scroll.lockscroll', function () {
                        for(let otherCiIndex = 0; otherCiIndex < me.arrCi.length; otherCiIndex++){
                            if(otherCiIndex != ciIndex){
                                let otherCiBlock = me.arrCi[otherCiIndex].jqueryObj.find('.ciCode');
                                $(otherCiBlock).scrollTop($(this).scrollTop());
                            }
                        }
                    });
                });

                $(currentCiBlock).on('mouseleave.lockscroll', function(){
                    $(currentCiBlock).off('scroll.lockscroll');
                    for(let otherCiIndex = 0; otherCiIndex < me.arrCi.length; otherCiIndex++){
                        if(otherCiIndex != ciIndex){
                            let otherCiBlock = me.arrCi[otherCiIndex].jqueryObj.find('.ciCode');
                            $(otherCiBlock).off('scrollTop.lockscroll');
                        }
                    }
                });
                
            }
            me.lockScrollOption = true;
            me.jqueryObj.find('a.lockscroll input').prop('checked', true);
        }
    }
    setCollectionHeader(){
        if(this.jqueryObj != undefined){
            let me = this;
            if (this.arrCi.length <= this.settings.maxCIColumns) {
                this.jqueryObj.wrapInner('<div class="ciCollection ciCollection-'+this.arrCi.length+'"></div>');
            } else if (this.settings.maxCIColumns < 10) {
                this.jqueryObj.wrapInner('<div class="ciCollection ciCollection-'+this.settings.maxCIColumns+'"></div>');
            } else {
                this.jqueryObj.wrapInner('<div class="ciCollection ciCollection-tops"></div>');
            }

            let lockScrollButton = $('<a class="cibtn lockscroll" href="javascript:"><input type="checkbox" /> Lock CI scroll</a>');
            lockScrollButton.on('click', function(){ me.lockScrollToggle() });

            let ciCollectionHeader = $('<div class="ciCollection-header"></div>');
            ciCollectionHeader.append('<div class="messages"></div>');

            if (this.arrCi.length > 1) {
                ciCollectionHeader.append(lockScrollButton);
            }

            this.jqueryObj.prepend(ciCollectionHeader);
        }
    }
    highlight(){
        for(let ci of this.arrCi){
            ci.syntaxHighlighter();
            ci.regexSearches();
        }
    }
}
