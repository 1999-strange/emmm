class encn_MyDictionary {
    constructor() {
        // Initialization code if needed...
        this.baseUrl = "https://www.merriam-webster.com/dictionary/";
    }

    findTerm(word) {
        return new Promise((resolve, reject) => {
            // Step 1: Create the URL for querying the word
            const queryUrl = `${this.baseUrl}${encodeURIComponent(word)}`;
            
            // Step 2: Use fetch API to get the content from the online dictionary
            fetch(queryUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(htmlString => {
                    // Step 3: Parse the HTML string to extract the definition
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlString, 'text/html');
                    
                    // Example: Using querySelector to extract the definition content
                    const definitionElement = doc.querySelector('.vg .dtText');
                    if (definitionElement) {
                        const definitionText = definitionElement.textContent.trim();
                        resolve(definitionText);
                    } else {
                        reject('Definition not found');
                    }
                })
                .catch(error => {
                    // Handle any errors that occurred during fetch or parsing
                    reject(`Failed to fetch the word definition: ${error.message}`);
                });
        });
    }
}

// Example usage:
const myDictionary = new encn_MyDictionary();
myDictionary.findTerm('example')
    .then(definition => {
        console.log('Definition:', definition);
    })
    .catch(error => {
        console.error('Error:', error);
    });
