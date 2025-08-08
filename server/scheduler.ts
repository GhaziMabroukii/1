import { storage } from "./storage";

// Schedule contract expiration checks every hour
export function startContractExpirationScheduler() {
  const HOUR_IN_MS = 60 * 60 * 1000;
  
  console.log("Starting contract expiration scheduler...");
  
  // Run initial check
  checkExpiredContracts();
  
  // Schedule recurring checks
  setInterval(async () => {
    try {
      await checkExpiredContracts();
    } catch (error) {
      console.error("Error in scheduled contract expiration check:", error);
    }
  }, HOUR_IN_MS);
}

async function checkExpiredContracts() {
  try {
    console.log("Checking for expired contracts...");
    await storage.expireContracts();
    console.log("Contract expiration check completed");
  } catch (error) {
    console.error("Failed to check expired contracts:", error);
  }
}