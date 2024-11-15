class encn_MyDictionary {
    constructor() {
        // Initialization code if needed...
        this.baseUrl = "https://www.merriam-webster.com/dictionary/";
        this.maxexample = 2;
    }

    async displayName() {
        let locale = await api.locale();
        if (locale.indexOf('CN') != -1) return '韦氏英语词典';
        if (locale.indexOf('TW') != -1) return '韦氏英语词典';
        return 'Merriam-Webster Dictionary';
    }

    setOptions(options) {
        this.options = options;
        if (options.maxexample) {
            // this.maxexample = options.maxexample;
        }
    }

    async findTerm(word) {
        this.word = word;
        let list = [];
        let word_stem = await api.deinflect(word);
        if (word.toLowerCase() != word) {
            let lowercase = word.toLowerCase();
            let lowercase_stem = await api.deinflect(lowercase);
            list = [word, word_stem, lowercase, lowercase_stem];
        } else {
            list = [word, word_stem];
        }
        let promises = list.map((item) => this.findMerriamWebster(item));
        let results = await Promise.all(promises);
        return [].concat(...results).filter(x => x);
    }

    async findMerriamWebster(word) {
        let notes = [];
        if (!word) return notes; // return empty notes

        function T(node) {
            if (!node)
                return '';
            else
                return node.innerText.trim();
        }

        let url = this.baseUrl + encodeURIComponent(word);
        let doc = '';
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
        } catch (err) {
            return [];
        }

        let dictionary = doc.querySelector('.entry-header');
        if (!dictionary) return notes; // return empty notes

        let expression = T(dictionary.querySelector('h1.hword')); // Updated for correct header element
        let reading = T(doc.querySelector('.pr')); // Adjusted to match the correct structure of pronunciation

        let sound = doc.querySelector('.play-pron');
        let audios = sound ? [sound.getAttribute('data-file')] : [];

        // make definition segment
        let definitions = [];
        let defblocks = doc.querySelectorAll('.vg .sb') || [];
        for (const defblock of defblocks) {
            let pos = T(defblock.querySelector('.fl')); // Part of speech
            pos = pos ? `<span class="pos">${pos}</span>` : '';
            let eng_tran = T(defblock.querySelector('.dtText'));
            if (!eng_tran) continue;
            let definition = '';
            eng_tran = eng_tran.replace(RegExp(expression, 'gi'), '<b>$&</b>');
            eng_tran = `<span class='eng_tran'>${eng_tran}</span>`;
            let tran = `<span class='tran'>${eng_tran}</span>`;
            definition += `${pos}${tran}`;

            // make example segment
            let examps = defblock.querySelectorAll('.ex-sent.t') || '';
            if (examps.length > 0) {
                definition += '<ul class="sents">';
                for (const [index, examp] of examps.entries()) {
                    if (index >= this.maxexample) break; // Limit to maxexample
                    let eng_examp = T(examp) ? T(examp).replace(RegExp(expression, 'gi'), '<b>$&</b>') : '';
                    definition += eng_examp ? `<li class='sent'><span class='eng_sent'>${eng_examp}</span></li>` : '';
                }
                definition += '</ul>';
            }
            definition && definitions.push(definition);
        }
        let css = this.renderCSS();
        notes.push({
            css,
            expression,
            reading,
            definitions,
            audios,
        });
        return notes;
    }

    renderCSS() {
        let css = `
            <style>
                span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                span.tran {margin:0; padding:0;}
                span.eng_tran {margin-right:3px; padding:0;}
                ul.sents {font-size:0.8em; list-style:square inside; margin:3px 0;padding:5px;background:rgba(13,71,161,0.1); border-radius:5px;}
                li.sent  {margin:0; padding:0;}
                span.eng_sent {margin-right:5px;}
            </style>`;
        return css;
    }
}


