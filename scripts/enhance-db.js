class BookCache {
    #db = null;

    connectDB() {
        return new Promise((resolve, reject) => {
            const req = window.indexedDB.open('SimpleTextReader-enhance', 1);
            req.onupgradeneeded = function (evt) {
                console.log("openDB.onUpgradeNeeded");
                let db = evt.target.result;
                console.log(`Upgrading to version ${db.version}`);

                // Create an objectStore for this database
                if (!db.objectStoreNames.contains("books")) {
                    console.log("Initial DB");
                    db.createObjectStore("books", { keyPath: "filename" });
                }
            };
            req.onsuccess = function (evt) {
                console.log("openDB.onSuccess");
                resolve(evt.target.result);
            };
            req.onerror = function (evt) {
                console.log("openDB.onError");
                reject(evt.target.error);
            };
        });
    }

    getObjectStore(name, mode = "readonly") {
        let trans = this.#db.transaction(name, mode);
        // trans.oncomplete = function (evt) {
        //     console.log("trans.onComplete");
        //     console.log(evt.target);
        // }
        trans.onerror = function (evt) {
            console.log("trans.onError");
            console.log(evt.target.error);
        };
        return trans.objectStore(name);
    }

    exec(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = (evt) => {
                console.log("exec.onSuccess: ");
                console.log(evt.target);
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.log("exec.onError: ");
                console.log(evt.target);
                reject(evt.target.error);
            };
        });
    }

    async putBook(bookdata) {
        await this.init();
        if (!this.#db) {
            return null;
        }
        let tbl = this.getObjectStore("books", "readwrite");
        console.log("putBook: " + bookdata.filename);
        return await this.exec(tbl.put(bookdata));
    }

    async getBook(filename) {
        await this.init();
        console.log("BookCache.getBook: " + filename);
        if (!this.#db) {
            return null;
        }
        let tbl = this.getObjectStore("books");
        console.log("getBook: " + filename);
        let result = await this.exec(tbl.get(filename));
        console.log("getBook: " + result);
        return result;
    }

    async init() {
        try {
            if (!this.#db) {
                this.#db = await this.connectDB();
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }
}

let bc = new BookCache();

// setTimeout(async function() {
//     // let res = await bc.putBook({filename: "book-1.txt", bookName: "Book 1", author: "Author 1", content: "Book 1<br>Author 1", size: 200});
//     let res = await bc.getBook("book-2.txt");
//     console.log(res?res:"NULL");
// }, 1000);
