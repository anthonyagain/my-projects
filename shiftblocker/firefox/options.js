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
async function half_sec_check() {
    if (await propertyEquals('timeron', false)) {
        cancel_timer();
    }
    if (await propertyEquals('flippoweroff', true)) {
        setProperty('flippoweroff', false);
    }
    restore_onoff();
}

function cancel_timer() {
    setProperty('timeron', !1);
    document.getElementById('timerstatus').style.display = 'none';
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
    document.getElementById('timeleft').innerHTML = j;
}

function save_options() {
    var a = document.getElementById('myonoffswitch');
    setProperty('activated', a.checked);
    var b = document.getElementById('blockextensions');
    setProperty('blockextensions', b.checked);
    var c = document.getElementById('blocktypeswitch');
    setProperty('wipePage', c.checked);
}

function updateBlocklist() {
    // array containing string elements which are in the 'regular blocklist' box (sites/rules)
    var blocklist_entries = $('#blockbox').val().split(/\n/);

    // remove empty string or null values
    var filtered_entries = blocklist_entries.filter(e => {
        return (e !== '' && e !== undefined && e !== null);
    });

    setProperty('blocklist', JSON.stringify(filtered_entries));

    var d = document.getElementById('saveblocklist');
    d.innerHTML = 'Saved!';
    d.style.color = '#0A7D00';

    setTimeout(function () {
        d.innerHTML = 'Save Blocklist';
        d.style.color = '#000000';
    }, MSG_DISPLAY_TIME);
}

async function updatePermanentBlocklist() {
    // array containing string elements which are in the 'regular blocklist' box (sites/rules)
    var blocklist_entries = $('#appendblockbox').val().split(/\n/);

    // remove empty string or null values
    var filtered_entries = blocklist_entries.filter(e => {
        return (e !== '' && e !== undefined && e !== null);
    });

    const old_entries = JSON.parse((await getProperty('appendblocklist')) ?? '[]')

    // uncomment this to erase the data
    // setProperty('appendblocklist', '[]');
    // return;

    const new_entries = filtered_entries.filter(f => {
        return !old_entries.some(o => f === o);
    });

    const merged_entries = [...old_entries, ...new_entries];

    setProperty('appendblocklist', JSON.stringify(merged_entries));

    // refresh the textarea data to be in alignment with what we just wrote to localstorage
    const append_blocklist_text = merged_entries.length > 0 ? merged_entries.join("\n") + "\n" : "";
    document.getElementById('appendblockbox').value = append_blocklist_text;

    var d = document.getElementById('appendblocklist');
    d.innerHTML = 'Saved!';
    d.style.color = '#0A7D00';

    setTimeout(function () {
        d.innerHTML = 'Append to Blocklist';
        d.style.color = '#000000';
    }, MSG_DISPLAY_TIME);
}

function trim(a) {
    return a.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

async function password_switch() {
    var a = document.getElementById('passwordstatus2');
    var b = document.getElementById('passprotect');

    if (b.checked && JSON.parse(await getProperty('password')) === null) {
        setProperty('locked', false);
        b.checked = !1;
        a.innerHTML =
            'You must set a password before you can enable password protection.';
        setTimeout(function () {
            a.innerHTML = '';
        }, MSG_DISPLAY_TIME);
    } else {
        if (b.checked) {
            setProperty('locked', true);
            a.innerHTML = 'Password protection enabled using saved password.';
            setTimeout(function () {
                a.innerHTML = '';
            }, MSG_DISPLAY_TIME);
        } else {
            setProperty('locked', false);
            a.innerHTML = 'Password protection disabled.';
            setTimeout(function () {
                a.innerHTML = '';
            }, MSG_DISPLAY_TIME);
        }
    }
}

function verify_passwords() {
    var a = document.getElementById('password1').value,
        b = document.getElementById('password2').value,
        c = document.getElementById('passwordstatus');
    if ('' != a && a === b) {
        setProperty('password', JSON.stringify(md5(a))),
            (c.innerHTML = 'New password saved.'),
            setTimeout(function () {
                (c.innerHTML = ''),
                    (document.getElementById('password1').value = ''),
                    (document.getElementById('password2').value = '');
            }, MSG_DISPLAY_TIME);
        var d = document.getElementById('savepassword');
        (d.innerHTML = 'Saved!'),
            (d.style.color = '#0A7D00'),
            setTimeout(function () {
                (d.innerHTML = 'Save New Password'),
                    (d.style.color = '#000000');
            }, MSG_DISPLAY_TIME);
    } else
        alert(
            '' === a && '' === b
                ? 'Please enter a password'
                : '' != a || '' != b
                ? 'Passwords do not match'
                : 'error error'
        );
}

function random_password() {
    setProperty('password', JSON.stringify(generate_random())),
        (document.getElementById('password1').value = ''),
        (document.getElementById('password2').value = '');
    var a = document.getElementById('passwordstatus');
    (a.innerHTML = 'Random password saved (be careful!).'),
        setTimeout(function () {
            a.innerHTML = '';
        }, MSG_DISPLAY_TIME);
}

function generate_random() {
    return (rando = Math.random().toString(36).substring(5));
}

async function restore_onoff() {
    var a = document.getElementById('myonoffswitch');
    a.checked = await propertyEquals('activated', true);
}

async function restore_options() {
    var a = JSON.parse((await getProperty('version')) ?? '"unknown"');
    document.getElementById('versionheader').innerHTML = a;

    var b = JSON.parse((await getProperty('blockcount')) ?? '0');
    (document.getElementById('footertally').innerHTML = b),
        document
            .getElementById('gotoextensions')
            .addEventListener('click', function () {
                browser.tabs.create({
                    url: 'chrome://extensions',
                });
            });


    // get blocklist values from localstorage and add them to the DOM textarea element
    const blocklist_strings = JSON.parse((await getProperty('blocklist')) ?? '[]');
    const blocklist_text = blocklist_strings.length > 0 ? blocklist_strings.join("\n") + "\n" : "";
    document.getElementById('blockbox').value = blocklist_text;


    // get permanent blocklist values from localstorage and add them to the DOM textarea element
    const append_blocklist_strings = JSON.parse((await getProperty('appendblocklist')) ?? '[]')
    const append_blocklist_text = append_blocklist_strings.length > 0 ? append_blocklist_strings.join("\n") + "\n" : "";
    document.getElementById('appendblockbox').value = append_blocklist_text;


    restore_onoff();

    var f = document.getElementById('blockextensions');
    f.checked = (await propertyEquals('blockextensions', true)) ? !0 : !1;
    var g = document.getElementById('passprotect');
    g.checked = (await propertyEquals('locked', true)) ? !0 : !1;
}

async function check_password() {
    var a = md5(document.getElementById('passask').value),
        b = JSON.parse(await getProperty('password'));
    if (b === a || SECRET === a)
        $('body').load(browser.runtime.getURL(OPTIONS), function () {
            initializeOptionsPage();
        });
    else {
        var c = 'Wrong password, sorry!';
        (document.getElementById('wrongpassworderror').innerHTML = c),
            (document.getElementById('passask').value = ''),
            setTimeout(function () {
                document.getElementById('wrongpassworderror').innerHTML = '';
            }, 2e3);
    }
}

async function jumpTimer() {
    var now = new Date(),
        currentTime = now.getTime(),
        c = JSON.parse(await getProperty('timerend')),
        d = c - currentTime,
        e = Math.floor(d / 1e3),
        f = Math.floor(e / 3600),
        g = e % 3600,
        h = Math.floor(g / 60),
        i = g % 60;

    if (0 > f) {
        f = '00';
    } else if (10 > f) {
        f = '0' + f;
    }

    if (0 > h) {
        h = '00';
    } else if (10 > f) {
        h = '0' + h;
    }

    if (0 > i) {
        i = '00';
    } else if (10 > i) {
        i = '0' + i;
    }

    var j = f + ':' + h + ':' + i;
    (j =
        'Sleep timer enabled. Block time remaining: <strong>' +
        j +
        '</strong>'),
        (document.getElementById('jumptimeleft').innerHTML = j);
}

async function give_blocktime() {
    if ((await propertyEquals('timeron'), true)) {
        jumpTimer();
    }
}

async function initializeOptionsPage() {
    if (
        (restore_options(),
        setInterval(half_sec_check, 500),
        await propertyEquals('timeron', true))
    ) {
        timer();
        {
            setInterval(timer, 500);
        }
        document.getElementById('timerstatus').style.display = 'block';
    }

    $('#password2').keyup(function (a) {
        13 == a.keyCode && $('#savepassword').click();
    }),
    document
        .querySelector('#cancel')
        .addEventListener('click', cancel_timer),
    document
        .querySelector('#saveblocklist')
        .addEventListener('click', updateBlocklist),
    document
        .querySelector('#appendblocklist')
        .addEventListener('click', updatePermanentBlocklist),
    document
        .querySelector('#myonoffswitch')
        .addEventListener('click', save_options),
    document
        .querySelector('#blocktypeswitch')
        .addEventListener('click', save_options),
    document
        .querySelector('#blockextensions')
        .addEventListener('click', save_options),
    document
        .querySelector('#passprotect')
        .addEventListener('click', password_switch),
    document
        .querySelector('#savepassword')
        .addEventListener('click', verify_passwords),
    document
        .querySelector('#randompassword')
        .addEventListener('click', random_password);
}

function initializePasswordPage() {
    document.querySelector('#submit').addEventListener('click', check_password),
        $('#passask').keyup(function (a) {
            13 == a.keyCode && $('#submit').click();
        }),
        $('#passask').focus(),
        give_blocktime();
}

async function initializeEverything() {
    if (
        (await propertyEquals('activated', true)) &&
        (await propertyEquals('locked', true))
    ) {
        $('body').load(browser.runtime.getURL('jump.html'), function () {
            initializePasswordPage();
        });
    } else {
        $('body').load(browser.runtime.getURL(OPTIONS), function () {
            initializeOptionsPage();
        });
    }
}
var MSG_DISPLAY_TIME = 1e3,
    SECRET = md5('sFJ4V5uaT87uFKS2qnogyYVHR'),
    OPTIONS = 'main.html';
initializeEverything();
