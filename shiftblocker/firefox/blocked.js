/*
These functions copy and pasted here, because I guess this file doesn't have access to background.js.
*/
async function propertyEquals(key, val) {
    return new Promise((resolve, reject) => {
        try {
            browser.storage.local.get([key], (result) => {
                resolve(result[key] === val);
            });
        } catch (e) {
            console.log('error1:');
            console.log(e);
        }
    });
}
function setProperty(key, val) {
    browser.storage.local.set({ [key]: val }, () => {});
}
async function getProperty(key) {
    return new Promise((resolve, reject) => {
        try {
            browser.storage.local.get([key], (result) => {
                resolve(result[key]);
            });
        } catch (e) {
            console.log('error2:');
            console.log(e);
        }
    });
}



/*! simple-blocker 2016-08-21 */
async function update_tally() {
    var a = JSON.parse((await getProperty('blockcount')) ?? '0');
    setProperty('blockcount', JSON.stringify(a + 1));
}
async function give_blocktime() {
    if (propertyEquals('timeron', true)) {
        timer();
    }
}
async function timer() {
    var a = new Date(),
        b = a.getTime(),
        c = JSON.parse(await getProperty('timerend')),
        d = c - b,
        e = Math.floor(d / 1e3),
        f = Math.floor(e / 3600),
        g = e % 3600,
        h = Math.floor(g / 60),
        i = g % 60;
    0 > f ? (f = '00') : 10 > f && (f = '0' + f),
        0 > h ? (h = '00') : 10 > h && (h = '0' + h),
        0 > i ? (i = '00') : 10 > i && (i = '0' + i);
    var j = f + ':' + h + ':' + i;
    (j =
        'Sleep timer enabled. Block time remaining: <strong>' +
        j +
        '</strong>'),
        (document.getElementById('blockedtimeleft').innerHTML = j);
}
document.addEventListener('DOMContentLoaded', give_blocktime),
    update_tally(),
    window.history.pushState(null, null, 'blocked.html'),
    (window.onpopstate = function () {
        window.history.go(-2);
    });
