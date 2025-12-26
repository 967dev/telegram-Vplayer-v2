let db;

export function initDB(callback) {
    const request = indexedDB.open("musicPlayerDB_tg", 2); // Version 2 for backgrounds store

    request.onerror = (e) => console.error("Database error:", e.target.errorCode);

    request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains("tracks")) {
            database.createObjectStore("tracks", { keyPath: "id", autoIncrement: true });
        }
        if (!database.objectStoreNames.contains("custom_assets")) {
            database.createObjectStore("custom_assets", { keyPath: "key" });
        }
    };

    request.onsuccess = (e) => {
        db = e.target.result;
        if (callback) callback();
    };
}

// Tracks
export function saveTrackToDB(file, callback) {
    const transaction = db.transaction(["tracks"], "readwrite");
    const store = transaction.objectStore("tracks");
    const entry = {
        file: file,
        fileName: file.name.replace(/\.[^/.]+$/, ""),
        artistName: "Local File"
    };
    const req = store.add(entry);
    req.onsuccess = (e) => {
        const track = { id: e.target.result, fileName: entry.fileName, artistName: entry.artistName };
        if (callback) callback(track);
    };
}

export function loadPlaylistFromDB(callback) {
    if (!db) return;
    const transaction = db.transaction("tracks", "readonly");
    const store = transaction.objectStore("tracks");
    store.getAll().onsuccess = (e) => {
        const tracks = e.target.result.map(({ id, fileName, artistName }) => ({ id, fileName, artistName }));
        if (callback) callback(tracks);
    };
}

export function getTrackFileFromDB(id, callback) {
    if (!db) return;
    const transaction = db.transaction("tracks", "readonly");
    const store = transaction.objectStore("tracks");
    store.get(id).onsuccess = (e) => {
        if (callback && e.target.result) callback(e.target.result.file);
    };
}

export function deleteTrackFromDB(id, callback) {
    if (!db) return;
    const transaction = db.transaction(["tracks"], "readwrite");
    const store = transaction.objectStore("tracks");
    store.delete(id).onsuccess = () => {
        if (callback) callback();
    };
}

// Custom Assets (Backgrounds)
export function saveBackgroundToDB(file, type, callback) {
    if (!db) return;
    const transaction = db.transaction(["custom_assets"], "readwrite");
    const store = transaction.objectStore("custom_assets");
    const entry = { key: "current_bg", file: file, type: type };
    store.put(entry).onsuccess = () => {
        if (callback) callback();
    };
}

export function getBackgroundFromDB(callback) {
    if (!db) return;
    const transaction = db.transaction("custom_assets", "readonly");
    const store = transaction.objectStore("custom_assets");
    store.get("current_bg").onsuccess = (e) => {
        if (callback) callback(e.target.result);
    };
}
