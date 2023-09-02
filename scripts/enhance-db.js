class STReLocalDB {
    #db = null;

    connectDB() {
        return new Promise((resolve, reject) => {
            const req = window.indexedDB.open('SimpleTextReader-enhance', 1);
            req.onupgradeneeded = function (evt) {
                let db = evt.target.result;
                console.log(`Upgrading to version ${db.version}`);

                // Create an objectStore for this database
                if (!db.objectStoreNames.contains("bookfiles")) {
                    db.createObjectStore("bookfiles", { keyPath: "name" });
                }
            };
            req.onsuccess = function (evt) {
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
                resolve(evt.target.result);
            };
            request.onerror = (evt) => {
                console.log("exec.onError: ");
                console.log(evt.target);
                reject(evt.target.error);
            };
        });
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

    async putBook(name, data) {
        if (!await this.init()) {
            throw new Error("Init local db error!");
        }
        let tbl = this.getObjectStore("bookfiles", "readwrite");
        return await this.exec(tbl.put({name: name, data: data}));
    }

    async getBook(name) {
        if (!await this.init()) {
            throw new Error("Init local db error!");
        }
        let tbl = this.getObjectStore("bookfiles");
        let result = await this.exec(tbl.get(name));
        if (result) {
            return result.data;
        } else {
            return null;
        }
    }

    async getAllBooks() {
        if (!await this.init()) {
            throw new Error("Init local db error!");
        }
        let tbl = this.getObjectStore("bookfiles");
        let result = await this.exec(tbl.getAll());
        return result;
    }

    async isBookExist(name) {
        if (!await this.init()) {
            throw new Error("Init local db error!");
        }
        let tbl = this.getObjectStore("bookfiles");
        let result = await this.exec(tbl.getKey(name));
        return !!result;
    }

    async deleteBook(name) {
        if (!await this.init()) {
            throw new Error("Init local db error!");
        }
        let tbl = this.getObjectStore("bookfiles", "readwrite");
        await this.exec(tbl.delete(name));
    }
}
