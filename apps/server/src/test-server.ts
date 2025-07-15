import { serve } from "@hono/node-server"
import { getFakeDb, fakeDeps } from "./tests/utils"
import { app } from "./index"
import { seedTestData } from "./tests/seed-test-data"

const startTestServer = async () => {
  // Get fake database for testing
  const fakeDb = await getFakeDb()
  
  // Seed test data
  await seedTestData(fakeDb)
  
  // Create test dependencies middleware
  const testDeps = fakeDeps(fakeDb)

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 9000
  
  serve({ 
    fetch: app(testDeps).fetch, 
    port: PORT 
  })
  
  console.log(` ✅ Test server starting on port ${PORT}...`)
  console.log(` 📊 Using fake database for testing`)
}

startTestServer().catch(console.error)