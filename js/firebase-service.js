
// Wrapper for Firebase Logic
let db = null;
let isInitialized = false;

export const FirebaseService = {
    async init(config) {
        if (isInitialized) return true;

        try {
            if (!window.firebaseModules) {
                console.error("Firebase SDK not loaded");
                return false;
            }

            const { initializeApp, getFirestore } = window.firebaseModules;
            const app = initializeApp(config);
            db = getFirestore(app);
            isInitialized = true;
            console.log("Firebase Initialized");
            return true;
        } catch (e) {
            console.error("Firebase Init Error:", e);
            alert("Firebase 連線失敗，請檢查設定: " + e.message);
            return false;
        }
    },

    isReady() {
        return isInitialized;
    },

    // Generic Fetch
    async getAll(collectionName) {
        if (!db) return [];
        const { collection, getDocs } = window.firebaseModules;
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error(`Error fetching ${collectionName}:`, e);
            throw e;
        }
    },

    // Generic Add (or Set if id provided)
    async add(collectionName, data) {
        if (!db) return null;
        const { collection, addDoc, setDoc, doc } = window.firebaseModules;

        try {
            if (data.id) {
                // If ID exists, use setDoc to preserve it
                await setDoc(doc(db, collectionName, data.id), data);
                return data;
            } else {
                // Let Firestore generate ID
                const docRef = await addDoc(collection(db, collectionName), data);
                return { id: docRef.id, ...data };
            }
        } catch (e) {
            console.error(`Error adding to ${collectionName}:`, e);
            throw e;
        }
    },

    // Set/Update specific doc
    async set(collectionName, id, data) {
        if (!db) return;
        const { doc, setDoc } = window.firebaseModules;
        try {
            await setDoc(doc(db, collectionName, id), data, { merge: true });
        } catch (e) {
            console.error(`Error setting ${collectionName}/${id}:`, e);
            throw e;
        }
    },

    async delete(collectionName, id) {
        if (!db) return;
        const { doc, deleteDoc } = window.firebaseModules;
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch (e) {
            console.error(`Error deleting ${collectionName}/${id}:`, e);
            throw e;
        }
    }
};
