/* global self, caches, fetch, Promise, idb, IDBKeyRange, decodeURIComponent */
console.trace('sw');
importScripts("/plan/libs/idb.min.js");
const version = 13;
const eventCachingTime = 3; //days
const staticFiles=[
	"https://5grwum.ga/plan/",
	"/plan/img/exit.png",
	"/plan/css/style.css",
	"/plan/js/useFireBase.js",
	"/plan/js/initPWA.js",
    '/plan/libs/all.js',
    '/plan/js/gCal.js',
    "/plan/templates/t.js",
    '/plan/js/eventInfo.js',
    '/plan/js/router.js',
    '/plan/js/settings.js',
    '/plan/js/app.js',
    '/plan/libs/all.css'
        //"https://www.gstatic.com/firebasejs/6.6.2/firebase-app.js",
        //"https://www.gstatic.com/firebasejs/6.6.1/firebase-messaging.js"
];

let db;

async function setupDB() {
    return await idb.openDB('plan', 1, {
        upgrade(db) {
            const eventStore = db.createObjectStore('events', { keypath: 'id' });
            eventStore.createIndex('startIndex', 'startIndex');
            eventStore.createIndex('endIndex', 'endIndex');
            const syncData = db.createObjectStore('syncData', { keypath: 'updated' });
            syncData.createIndex('timeMin','timeMin');
            syncData.createIndex('timeMax','timeMax');
        },
        error(e) {
            console.log(e);
        },
        blocked() {
          // …
        },
        blocking() {
          // …
        }
    });
}

async function saveEvents(db, items, type) {
    const tx = db.transaction('events', 'readwrite');
    const events = tx.store;
    for (let i=0; i<items.length; i++) {
        let item = items[i];
        item.startIndex = new Date(item.start.dateTime || item.start.date).getTime();
        item.endIndex   = new Date(item.end.dateTime   || item.end.date  ).getTime();
        item.type = type;
        try {
            events.put(item, item.id);
        } catch (e) {
            console.log('error in adding to db', e);
        }
    };
    return await tx.done;
}

async function checkEventsDownloaded(db, timeMin, timeMax) {
	if (!(timeMin && timeMax)) return false;
    const tx = db.transaction('syncData','readwrite');
    const data = tx.store, diff = eventCachingTime*1000*3600*24;
    timeMin = new Date(timeMin);
    timeMax = new Date(timeMax);
//    console.log({diff});
//    const fresh = new Date(Date.now()-diff).getTime();
//    console.log({fresh});
//    const nowRange = IDBKeyRange.upperBound(fresh);
//    let cursor = await data.openCursor();
//    while (cursor) {
//        await cursor.delete();
//        cursor = await cursor.continue();
//    }
    async function recurse(timeMin) {
        const minRange = IDBKeyRange.upperBound(new Date(timeMin)); ///
        const minIndex = data.index('timeMin');
        let result = await getItemsInRange(minIndex, minRange);
        let item = result[result.length-1];
        console.log('last item:',item);
            //console.table({timeMin, timeMax, itemTimeMax: item.timeMax});
        if (item && item.timeMax > timeMin) {
            if (item.timeMax >= timeMax) return true;
            else return recurse(item.timeMax);
        } else return false;
    }
    const result = await recurse(timeMin);
    await tx.done;
    return result;
}

async function markEventsDownloaded(db, timeMin, timeMax) {
    if (!(timeMin && timeMax)) return false;
    const tx = db.transaction('syncData','readwrite');
    const data = tx.store;
    const date = new Date();
    data.put({
        updated: date,
        timeMin: new Date(timeMin),
        timeMax: new Date(timeMax)
    }, date);
    return await tx.done;
}

async function getEvents(db, timeMin, timeMax) {
    const min = new Date(timeMin).valueOf();
    const max = new Date(timeMax).valueOf();
    console.log('time:',{min,max});
    const range = IDBKeyRange.bound(min, max);
    console.log({range});
    const tx = db.transaction('events');
    const events = tx.store;
    const result = await getItemsInRange(events.index('startIndex'), range);
    result.concat(await getItemsInRange(events.index('endIndex'), range));
    await tx.done;
    return unique(result);
}

async function getItemsInRange(index, range) {  
    const result = [];
    let cursor = await index.openCursor(range);
    console.log({cursor});
    while (cursor) {
        let item = cursor.value;
        result.push(item);
        cursor = await cursor.continue();
    }
    return result;
}

function getJSONResponse(object) {
    const text = JSON.stringify(object);
    return new Response(text, { 
        status: 200,
        headers: {
            'Content-type': 'application/json'
        }
    });
}

function unique(array) {
    const res = [];
    array.forEach(function(el){
        if (!res.find((second) => second.id === el.id)) {
            res.push(el);
        }
    });
    return res;
}

function getURLParams(url) {
    const paramPart = url.split('?')[1];
    const result = {};
    const entries = decodeURIComponent(paramPart)
            .split('&')
            .forEach(keyValue => {
                const array = keyValue.split('=');
                result[array[0]] = array[1];
            });
    return result;
}

async function fetchEvents(req, params) {
    console.log('events requested:', params);   
    const db = await setupDB(); 
    if (await checkEventsDownloaded(db, params.timeMin, params.timeMax)) {
        const result = await getEvents(db, params.timeMin, params.timeMax);
        console.log('to respond with:', result);
        return getJSONResponse({
            schedule: result.filter( ev => ev.type === 'schedule' ),
            exams: result.filter( ev => ev.type === 'exams' )
        });
    } else {
        const res = await fetch(req);
        try {
            const json = await res.clone().json();
            console.log('loaded json:',json);
            await saveEvents(db, json.schedule, 'schedule');
            await saveEvents(db, json.exams, 'exams');
            await markEventsDownloaded(db, params.timeMin, params.timeMax);
        } catch(e) {
            console.log('Error caught (in saving to DB):',e);
        };
        return res;
    }
}

self.addEventListener('install', function(event) {
  event.waitUntil(
        caches.open("staticFiles-v"+version)
            .then(function (cache) {
                return cache.addAll(staticFiles);
            })
            .catch(console.log)
            .then(function () {
                return setupDB();
            })
            .catch(console.log)
//            .then(function (db) {
//                
//            })
  );
    //importScripts('/plan/js/useFireBase.js');
    //const notificationPromise = setupNotificationsAsync();
//    try {
//        db = await setupDB();
//    } catch(e) {
//        console.log(e);
//        return;
//    }
//    return Promise.resolve();
//    return await Promise.all([
//        cachePromise,
//        //notificationPromise,
//        db
//    ]);
});

self.addEventListener('sync', (event) => {
    console.log('[cache-sw.js] sync triggered');
    
});

self.addEventListener('activate', (event) => {
    const staticName = 'staticFiles-v'+version,
        dynamicName = 'dynamicFiles-v'+version;
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
              cacheNames
                .filter(cacheName => !(cacheName === staticName || cacheName === dynamicName))
                .map(cacheName => caches.delete(cacheName))
            )
        )
    );
});

self.addEventListener('error', console.log);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method === 'GET') event.respondWith(
    caches.match(req).then((resp) => {        
        const URLregex = /https?:\/\/(www\.)?5grwum\.ga\/plan\/events\.php/;
        if (req.mode === 'navigate') {
            return caches.match('https://5grwum.ga/plan/');
        } else if (req.url.search(URLregex) === 0) {
            const params = getURLParams(req.url);
            if (params.get || params.getSynced) 
                return fetchEvents(req, params).catch(console.log);
            else 
                return fetch(req);
        } else {
            return resp || fetch(req).then((response) => {
                return caches.open('dynamicFiles-v'+version).then((cache) => {
                    cache.put(new URL(req.url), response.clone());
                    return response;
                });
            }).catch(console.log);
        }
    })
  );
});