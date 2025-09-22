// Test script to demonstrate the enhanced Google Keyword Planner logging
import { GoogleKeywordPlannerService } from './server/googleKeywordsClean.js';

async function testKeywordGeneration() {
  const service = new GoogleKeywordPlannerService();
  
  try {
    console.log("🚀 Starting keyword generation test...\n");
    
    const result = await service.generateKeywords(
      ["veterinario roma"],
      "IT", 
      "it",
      5
    );
    
    console.log("\n🎉 Test completed successfully!");
    console.log("Result:", result);
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testKeywordGeneration();