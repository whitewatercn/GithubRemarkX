let _remarksCache = null;

export function getRemarksCache() {
    return _remarksCache;
}

export function setRemarksCache(value) {
    _remarksCache = value;
}

export function getDavUrls(base) {
    if (!base) return { dir: '', file: '' };
    
    base = base.trim().replace(/\/+$/, '');
    
    let dirPath, fileUrl;
    if (base.endsWith('.json') || base.endsWith('.txt')) {
        let lastSlash = base.lastIndexOf('/');
        dirPath = lastSlash !== -1 ? base.substring(0, lastSlash + 1) : base + '/';
        fileUrl = base;
    } else {
        if (!base.toLowerCase().endsWith('githubremarkx')) {
            base += '/githubremarkX';
        }
        dirPath = base + '/';
        fileUrl = dirPath + 'githubremark.json';
    }
    
    return {
        dir: dirPath,
        file: fileUrl
    };
}

export function ensureDavFolder(urls, headers) {
    return fetch(urls.dir, { method: 'MKCOL', headers: headers })
        .then(res => res)
        .catch(() => ({})); // Ignore error
}

export function getAuthHeaders(user, pass) {
    return {
        'Authorization': 'Basic ' + btoa(user + ':' + pass),
        'Content-Type': 'application/json'
    };
}
