
import "dotenv/config";
import { seedDatabase } from "../src/lib/seed";

(async () => {
    try {
        await seedDatabase();
        console.log("Seeding complete.");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
