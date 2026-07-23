/**
 * Ported Regex Generation logic from Elixir Java implementation.
 * Ported to TypeScript/JavaScript for client-side functionality.
 */

export const generateRegex = (input) => {
    if (!input) return '';

    // Truncate to prevent long inputs from creating extremely complex regexes or ReDoS issues
    const safeInput = typeof input === 'string' ? input.slice(0, 100) : String(input).slice(0, 100);

    // Escape special regex characters so they don't break the regex pattern engine
    let pattern = '';
    for (let i = 0; i < safeInput.length; i++) {
        const char = safeInput[i];
        if (/[a-z]/.test(char)) {
            pattern += '[a-z]';
        } else if (/[A-Z]/.test(char)) {
            pattern += '[A-Z]';
        } else if (/\d/.test(char)) {
            pattern += '\\d';
        } else if (/\s/.test(char)) {
            pattern += '\\s';
        } else {
            // Escape any other characters (e.g. punctuation, symbols, brackets) to be matched literally
            pattern += '\\' + char;
        }
    }

    // Grouping repetitions
    pattern = pattern.replace(/(\[a-z\])+/g, (match) => {
        const repeat = match.length / 5;
        return repeat > 1 ? `[a-z]{${repeat}}` : '[a-z]';
    });
    pattern = pattern.replace(/(\[A-Z\])+/g, (match) => {
        const repeat = match.length / 5;
        return repeat > 1 ? `[A-Z]{${repeat}}` : '[A-Z]';
    });
    pattern = pattern.replace(/(\\d)+/g, (match) => {
        const repeat = match.length / 2;
        return repeat > 1 ? `\\d{${repeat}}` : '\\d';
    });
    pattern = pattern.replace(/(\\s)+/g, (match) => {
        const repeat = match.length / 2;
        return repeat > 1 ? `\\s{${repeat}}` : '\\s';
    });

    return `^${pattern}$`;
};

export const testRegex = (regex, text) => {
    try {
        const re = new RegExp(regex);
        return re.test(text);
    } catch (e) {
        return false;
    }
};
