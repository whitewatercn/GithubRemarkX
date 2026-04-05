export class GithubRemark {
    constructor(initParams) {
        this._started = false;
        this._watchUrls = ['github.com'];
        this._valueUpdateTime = Date.now();
    }

    get isStart() {
        return this._started;
    }

    set isStart(value) {
        this._started = value;
        this._valueUpdateTime = Date.now();
    }

    _insertFunc(tabId, changeInfo, tab) {
        // Do nothing, we use content_scripts in manifest.json now.
    }

    start() {
        if (this._started === true) return;
        chrome.tabs.onUpdated.addListener(this._insertFunc);
        chrome.storage.local.set({ recordStatus: "on" });
        this._started = true;
    }

    stop() {
        if (this._started === false) return;
        chrome.tabs.onUpdated.removeListener(this._insertFunc);
        chrome.storage.local.set({ recordStatus: "off" });
        this._started = false;
    }
}

export const gr = new GithubRemark();
