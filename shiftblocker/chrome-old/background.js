async function propertyEquals(key, val) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key] === val);
            });
        } catch (e) {
            console.log('error1:');
            console.log(e);
        }
    });
}
function setProperty(key, val) {
    chrome.storage.local.set({ [key]: val }, () => {});
}
async function getProperty(key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key]);
            });
        } catch (e) {
            console.log('error2:');
            console.log(e);
        }
    });
}

/*! simple-blocker 2016-08-21 */
async function first_time_setup_check() {
    if (await propertyEquals('sbisinstalled', 0)) {
        setProperty('sbisinstalled', true);

        chrome.tabs.create({
            url: chrome.runtime.getURL('options.html'),
        });
    }
}

async function local_storage_check() {
    if (await propertyEquals('activated', 0)) {
        setProperty('activated', true);
    }
    if (await propertyEquals('blocklist', 0)) {
        setProperty('blocklist', JSON.stringify({}));
    }
    if (await propertyEquals('blockextensions', 0)) {
        setProperty('blockextensions', false);
    }
    if (await propertyEquals('locked', 0)) {
        setProperty('locked', false);
    }
    if (await propertyEquals('password', 0)) {
        setProperty('password', JSON.stringify(null));
    }
    if (await propertyEquals('flippoweroff', 0)) {
        setProperty('flippoweroff', false);
    }
    if (await propertyEquals('timeron', 0)) {
        setProperty('timeron', false);
    }
    if (await propertyEquals('timerend', 0)) {
        setProperty('timerend', JSON.stringify(0));
    }
    if (await propertyEquals('blockcount', 0)) {
        setProperty('blockcount', JSON.stringify(0));
    }
    version_check();
}

function version_check() {
    var a = chrome.runtime.getManifest(),
        b = a.version;

    setProperty('version', JSON.stringify(b));
}

async function checktime() {
    if (await propertyEquals('timeron', true)) {
        var a = new Date(),
            b = a.getTime(),
            c = JSON.parse(getProperty('timerend'));

        if (b > c) {
            setProperty('timeron', false);
            setProperty('activated', false);
            setProperty('flippoweroff', true);
        }
    }
    if (propertyEquals('activated', false)) {
        setProperty('timeron', false);
    }
}

function handleExactBlock(block_text, tabObj, params) {
    if (block_text.substring(0, 7) === 'exact__') {
        /*
        Block all the sub-pages of a given "directory" on a site.

        For example, if the block_url is reddit.com/r/test, that page
        itself will be accessible, but all posts and pages within that
        subreddit will be blocked. (Blocking happens if there are
        more than 3 characters in the URL after the given URL substring).

        I'm not sure that this pattern is useful for anything; probably
        should just always use the 'only' one below.
        */
        const block_url = block_text.substring(7);
        let pos = tabObj.url.indexOf(block_url);

        if (pos == -1) return;
        else if (tabObj.url.substring(pos + block_url.length).length > 3) return;
        else block(tabObj, params);
        return true;
    }
}

function handleOnlyBlock(block_text, tabObj, params) {
    if (block_text.substring(0, 6) === 'only__') {
        /*
        If only, break down the URL into two parts: before and after
        the first slash (the domain and the rest of the URL).

        If we match both, pass. If we match the domain but not the rest of
        the URL, block.

        This allows for visiting only one sub-area of a domain.
        */
        const block_url = block_text.substring(4);
        let firstSlash = block_url.indexOf('/');
        let generalURL = block_url.substring(0, firstSlash);

        if (tabObj.url.indexOf(generalURL) === -1) return;
        else if (tabObj.url.indexOf(block_url) !== -1) return;
        else block(tabObj, params);
        return true;
    }
}

function handleTitleBlock(block_text, tabObj, params) {
    if(block_text.substring(0, 7) === 'title__') {
        /*
        If the given substring is found in the page's <title></title> tag,
        block the page.
        */
        const block_title = block_text.substring(7);

        if(tabObj.title.toLowerCase().includes(block_title)) {
            block(tabObj, params);
        }
        return true;
    }
}

function handleRegularBlock(block_text, tabObj, params) {
   /*
   Else, do a regular 'includes' check.
   */
   if(tabObj.url.includes(block_text)) {
       block(tabObj, params);
   }
}

async function checkUrl(tabObj) {
    if (tabObj !== null) {

        // CODE FOR REGULAR BLOCK LIST
        var block_list = JSON.parse((await getProperty('blocklist')) ?? '[]');
        var extensions_page_regex = new RegExp('chrome://extensions', 'i');

        const root_url = chrome.runtime.getURL('');

        const regularParams = { isPermanent: false };
        const permanentParams = { isPermanent: true };

        for (var f = 0; f < block_list.length; f++) {
            const block_text = block_list[f].toLowerCase();

            if(root_url.includes(block_text)) {
                // if our block pattern matches even the root URL, skip
                continue;
            }

            let ran = false;
            ran = ran || handleExactBlock(block_text, tabObj, regularParams);
            ran = ran || handleOnlyBlock(block_text, tabObj, regularParams);
            ran = ran || handleTitleBlock(block_text, tabObj, regularParams);
            // if no other block type has run, run a regular block check
            !ran && handleRegularBlock(block_text, tabObj, regularParams);
        }

        // CODE FOR PERMANENT BLOCK LIST

        var permanent_block_list = JSON.parse((await getProperty('appendblocklist')) ?? '[]');

        for (var g = 0; g < permanent_block_list.length; g++) {
            const block_text = permanent_block_list[g].toLowerCase();

            if(root_url.includes(block_text)) {
                // if our block pattern matches even the root URL, skip
                continue;
            }

            let ran = false;
            ran = ran || handleExactBlock(block_text, tabObj, permanentParams);
            ran = ran || handleOnlyBlock(block_text, tabObj, permanentParams);
            ran = ran || handleTitleBlock(block_text, tabObj, permanentParams);
            // if no other block type has run, run a regular block check
            !ran && handleRegularBlock(block_text, tabObj, permanentParams);
        }


        if (await propertyEquals('blockextensions', true)) {
            if (extensions_page_regex.test(tabObj.url)) {
                block(tabObj, regularParams);
            }
        }
    }
}

async function block(tabObj, params) {

    // config object storing isPermanent boolean.
    // true -> we are operating on a permanent block, which is active even if
    // the main power switch is off.
    const { isPermanent } = params;

    if (isPermanent || await propertyEquals('activated', true)) {
        if (await propertyEquals('wipePage', true)) {
            chrome.tabs.update(tabObj.id, {
                url: 'http://google.com',
            });
        } else {
            chrome.tabs.update(tabObj.id, {
                url: chrome.runtime.getURL('blocked.html'),
            });
        }
    }
}

function checkAllTabs() {
    chrome.tabs.query({}, function (tabList) {
        for (const tabObj of tabList) {
            checkUrl(tabObj);
        }
    });
}
var scanFreq = 5e3;

local_storage_check(),
    first_time_setup_check(),
    setInterval(local_storage_check, 3e4),
    setInterval(checktime, 1e3),
    checkAllTabs(),
    setInterval(checkAllTabs, scanFreq),
    chrome.tabs.onUpdated.addListener(function (tabID, changeInfo, tabObj) {
        checkUrl(tabObj);
    }),
    chrome.action.onClicked.addListener(function () {
        chrome.tabs.create({
            url: 'options.html',
        });
    });
