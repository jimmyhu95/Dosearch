import { scanDirectory } from '../src/lib/scanner/index.js';
import { db } from '../src/lib/db/index.js';
import { documents } from '../src/lib/db/schema.js';
import { sql } from 'drizzle-orm';

async function runTest() {
  console.log('--- Starting Manual Scan Test ---');
  const testPath = '/opt/skycode/data/opencode/7QUCj7bQSsSVpHutfpS3epB3tkNDak84miftN/doc-search-system/test-docs';
  
  try {
    const result = await scanDirectory(testPath);
    console.log('Scan completed successfully!');
    console.log(`Processed: ${result.processedFiles}, New: ${result.newFiles}, Updated: ${result.updatedFiles}`);
    
    // 查询数据库查看结果
    const allDocs = await db.select().from(documents);
    console.log('\n--- Documents in Database ---');
    allDocs.forEach(doc => {
      console.log(`- [${doc.fileType.toUpperCase()}] ${doc.title}`);
      console.log(`  Path: ${doc.filePath}`);
      console.log(`  Summary: ${doc.summary || 'No summary'}`);
    });
  } catch (error) {
    console.error('Scan failed:', error);
  }
  process.exit(0);
}

runTest();
