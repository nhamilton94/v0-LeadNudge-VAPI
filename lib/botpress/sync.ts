import { QualificationQuestion, FAQ } from '@/types/bot-customization';

/**
 * Botpress Tables Sync Module
 * 
 * REQUIRED BOTPRESS TABLES SETUP:
 * =================================
 * 
 * You need to create the following tables in Botpress Studio (Tables tab):
 * 
 * 1. bot_greetingsTable
 *    - organization_id (Text, Primary Key)
 *    - greeting_message (Text)
 *    - updated_at (DateTime)
 * 
 * 2. qualification_questionsTable
 *    - organization_id (Text, Primary Key)
 *    - questions_json (Text or JSON) - Stores array of qualification questions as JSON string
 *    - questions_count (Number)
 *    - updated_at (DateTime)
 * 
 * 3. faq_libraryTable
 *    - organization_id (Text, Primary Key)
 *    - faqs_json (Text or JSON) - Stores array of FAQs as JSON string
 *    - faqs_count (Number)
 *    - updated_at (DateTime)
 * 
 * 4. scheduling_messagesTable (Scheduling Messages)
 *    - organization_id (Text, Primary Key)
 *    - scheduling_messages_json (Text or JSON) - Stores array of scheduling messages as JSON string
 *    - scheduling_message_count (Number)
 *    - updated_at (DateTime)
 * 
 * TABLE STRUCTURE SUMMARY (5 Key Points for scheduling_messagesTable):
 * ======================================================================
 * 
 * 1. TABLE NAME: 
 *    - Create: "scheduling_messages" in Botpress Studio → Becomes: "scheduling_messagesTable"
 *    - Full table name: "scheduling_messagesTable"
 *    - API endpoint: /v1/tables/scheduling_messagesTable/rows/upsert
 * 
 * 2. PRIMARY KEY: 
 *    - Uses "organization_id" (Text/String type) as Primary Key
 *    - Format: UUID string (e.g., "00000000-0000-0000-0000-000000000001")
 *    - Each organization gets ONE row for scheduling messages
 *    - Used for upsert operations (insert or update based on organization_id)
 * 
 * 3. DATA TYPES: 
 *    - organization_id: Text/String (Primary Key - REQUIRED)
 *    - scheduling_messages_json: Text/String (stores JSON.stringify() of messages array)
 *    - scheduling_message_count: Number/Integer (count of messages in array)
 *    - updated_at: DateTime (Optional - timestamp of last update)
 * 
 * 4. MESSAGE STRUCTURE: 
 *    - scheduling_messages_json contains array of message objects:
 *      [
 *        {
 *          "type": "tour_confirmation",
 *          "message": "Great! Your tour at {property_name} is confirmed...",
 *          "placeholders": ["property_name", "tour_date", "tour_time"]
 *        },
 *        {
 *          "type": "not_qualified",
 *          "message": "Thank you for your interest...",
 *          "placeholders": ["property_name", "prospect_name"]
 *        }
 *      ]
 *    - Messages are stored as JSON string for easy parsing in workflows
 * 
 * 5. ACCESS PATTERN:
 *    - One row per organization (identified by organization_id)
 *    - When syncing, if row exists → UPDATE, if not → INSERT
 *    - Messages are scoped per organization for multi-tenant support
 *    - Access in workflows: bp.tables.getTable('scheduling_messagesTable').getRow({ organization_id: orgId })
 *    - Parse JSON: JSON.parse(row.scheduling_messages_json) to get array
 * 
 * IMPORTANT NOTES:
 * - Botpress automatically adds "Table" suffix to table names
 * - So "bot_greetings" becomes "bot_greetingsTable"
 * - All tables use organization_id as the Primary Key for upsert operations
 * - Questions and FAQs are stored as JSON strings for easy parsing in workflows
 * 
 * WORKFLOW USAGE:
 * ===============
 * In your Botpress workflows, you can read this data using:
 * 
 * const greetingTable = bp.tables.getTable('bot_greetingsTable');
 * const greetingRow = await greetingTable.getRow({ organization_id: orgId });
 * workflow.customGreeting = greetingRow.greeting_message;
 * 
 * const questionsTable = bp.tables.getTable('qualification_questionsTable');
 * const questionsRow = await questionsTable.getRow({ organization_id: orgId });
 * workflow.qualificationQuestions = JSON.parse(questionsRow.questions_json);
 * 
 * const faqsTable = bp.tables.getTable('faq_libraryTable');
 * const faqsRow = await faqsTable.getRow({ organization_id: orgId });
 * workflow.faqs = JSON.parse(faqsRow.faqs_json);
 * 
 * const messagesTable = bp.tables.getTable('scheduling_messagesTable');
 * const messagesRow = await messagesTable.getRow({ organization_id: orgId });
 * const schedulingMessages = JSON.parse(messagesRow.scheduling_messages_json);
 * workflow.tourConfirmation = schedulingMessages.find(m => m.type === 'tour_confirmation')?.message;
 * workflow.notQualified = schedulingMessages.find(m => m.type === 'not_qualified')?.message;
 */

// Botpress Admin API Configuration
// Reference: https://www.botpress.com/docs/api-reference/admin-api
const BOTPRESS_TOKEN = process.env.BOTPRESS_TOKEN || process.env.BOTPRESS_PAT;
const BOTPRESS_AGENT_ID = process.env.BOTPRESS_AGENT_ID || process.env.BOTPRESS_BOT_ID;
const BOTPRESS_WORKSPACE_ID = process.env.BOTPRESS_WORKSPACE_ID;

interface BotCustomizationData {
  greeting_message: string;
  qualification_questions: QualificationQuestion[];
  faqs: FAQ[];
  tour_confirmation_message: string;
  not_qualified_message: string;
  organization_id: string;
  property_id: string | null;
}

interface SyncResult {
  success: boolean;
  error?: string;
  bot_id?: string;
  details?: any;
}

/**
 * Sync bot customization settings to Botpress Tables
 * Reference: https://www.botpress.com/docs/api-reference/tables-api/openapi/endpoints/post-v1tables-rowsupsert
 */
export async function syncBotCustomizationToBotpress(
  data: BotCustomizationData
): Promise<SyncResult> {
  try {
    console.log('[Botpress Sync] Starting sync for organization:', data.organization_id);

    // Validate required credentials
    if (!BOTPRESS_TOKEN) {
      return {
        success: false,
        error: 'Missing BOTPRESS_TOKEN in environment variables. Need Personal Access Token (bp_pat_...)',
      };
    }

    if (BOTPRESS_TOKEN.startsWith('bp_bak_')) {
      return {
        success: false,
        error: 'BOTPRESS_TOKEN must be a Personal Access Token (bp_pat_...), not a Bot API Key (bp_bak_...)',
      };
    }

    if (!BOTPRESS_AGENT_ID) {
      return {
        success: false,
        error: 'Missing BOTPRESS_AGENT_ID (or BOTPRESS_BOT_ID) in environment variables',
      };
    }

    console.log('[Botpress Sync] Credentials validated');
    console.log('[Botpress Sync] Bot ID:', BOTPRESS_AGENT_ID);

    const syncResults: Record<string, { success: boolean; inserted?: number; updated?: number; error?: string }> = {};

    // Helper function to sync data to a Botpress Table
    const syncToTable = async (
      tableName: string,
      rows: any[],
      keyColumn: string = 'organization_id'
    ): Promise<{ success: boolean; inserted?: number; updated?: number; error?: string; details?: any }> => {
      try {
        const tablesApiUrl = `https://api.botpress.cloud/v1/tables/${tableName}/rows/upsert`;
        
        const payload = {
          rows,
          keyColumn,
          waitComputed: false
        };

        console.log(`[Botpress Sync] Syncing to ${tableName}...`);
        console.log(`[Botpress Sync] API URL:`, tablesApiUrl);
        console.log(`[Botpress Sync] Payload:`, JSON.stringify(payload, null, 2));

        const response = await fetch(tablesApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${BOTPRESS_TOKEN}`,
            'x-bot-id': BOTPRESS_AGENT_ID,
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log(`[Botpress Sync] ${tableName} response status:`, response.status);
        console.log(`[Botpress Sync] ${tableName} response body:`, responseText);

        if (!response.ok) {
          console.error(`[Botpress Sync] ❌ Failed to sync ${tableName}`);
          console.error(`[Botpress Sync] Error:`, responseText);
          return {
            success: false,
            error: `HTTP ${response.status}: ${responseText.substring(0, 200)}`
          };
        }

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[Botpress Sync] Failed to parse response:`, parseError);
          console.error(`[Botpress Sync] Raw response:`, responseText);
          return {
            success: false,
            error: 'Failed to parse response from Botpress API'
          };
        }

        // Check for errors in response (even if status is 200)
        if (result.errors && result.errors.length > 0) {
          console.error(`[Botpress Sync] ❌ ${tableName} has errors in response (even though 200 OK):`);
          result.errors.forEach((error: string, index: number) => {
            console.error(`[Botpress Sync] Error ${index + 1}:`, error);
          });
          
          // If there are errors, this is not a successful sync
          const errorMessage = result.errors.join('; ');
          console.error(`[Botpress Sync] ❌ ${tableName} sync failed with errors:`, errorMessage);
          return {
            success: false,
            error: `Botpress API returned errors: ${errorMessage}`,
            details: {
              errors: result.errors,
              warnings: result.warnings || []
            }
          };
        }
        
        // Check for warnings
        if (result.warnings && result.warnings.length > 0) {
          console.warn(`[Botpress Sync] ⚠️ ${tableName} has warnings:`);
          result.warnings.forEach((warning: string, index: number) => {
            console.warn(`[Botpress Sync] Warning ${index + 1}:`, warning);
          });
        }

        // Botpress API might return different structures
        // Check multiple possible response formats
        const inserted = result.inserted?.length || result.insertedCount || result.inserted || 0;
        const updated = result.updated?.length || result.updatedCount || result.updated || 0;
        const affected = result.affected || result.affectedRows || 0;

        console.log(`[Botpress Sync] ✅ ${tableName} synced successfully!`);
        console.log(`[Botpress Sync] Full response structure:`, JSON.stringify(result, null, 2));
        console.log(`[Botpress Sync] - Inserted:`, inserted, 'row(s)');
        console.log(`[Botpress Sync] - Updated:`, updated, 'row(s)');
        console.log(`[Botpress Sync] - Affected:`, affected, 'row(s)');

        // If no rows were inserted/updated but status is 200, there might be an issue
        if (inserted === 0 && updated === 0 && affected === 0 && (!result.errors || result.errors.length === 0)) {
          console.warn(`[Botpress Sync] ⚠️ Warning: 200 OK but no rows inserted/updated for ${tableName}`);
          console.warn(`[Botpress Sync] This might indicate:`);
          console.warn(`[Botpress Sync] 1. Key column "${keyColumn}" doesn't match table structure`);
          console.warn(`[Botpress Sync] 2. Column names don't match table schema`);
          console.warn(`[Botpress Sync] 3. Table doesn't exist or has wrong name`);
          console.warn(`[Botpress Sync] 4. Data type mismatch in columns`);
          console.warn(`[Botpress Sync] Please verify table structure in Botpress Studio`);
        }

        return {
          success: true,
          inserted: typeof inserted === 'number' ? inserted : (inserted?.length || 0),
          updated: typeof updated === 'number' ? updated : (updated?.length || 0),
        };
      } catch (error) {
        console.error(`[Botpress Sync] Error syncing ${tableName}:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    };

    // 1. Sync greeting
    console.log('[Botpress Sync] ========================================');
    console.log('[Botpress Sync] 1. Syncing Greeting');
    console.log('[Botpress Sync] ========================================');
    
    syncResults.greeting = await syncToTable(
      'bot_greetingsTable',
      [{
        organization_id: data.organization_id,
        greeting_message: data.greeting_message,
        updated_at: new Date().toISOString(),
      }]
    );

    // 2. Sync qualification questions
    console.log('[Botpress Sync] ========================================');
    console.log('[Botpress Sync] 2. Syncing Qualification Questions');
    console.log('[Botpress Sync] ========================================');
    console.log('[Botpress Sync] Questions count:', data.qualification_questions?.length || 0);
    console.log('[Botpress Sync] Questions data:', JSON.stringify(data.qualification_questions, null, 2));
    
    if (data.qualification_questions && data.qualification_questions.length > 0) {
      // Store questions as JSON string (column type is String/Text)
      const questionsJsonString = JSON.stringify(data.qualification_questions);
      
      const questionsPayload = {
        organization_id: data.organization_id,
        questions_json: questionsJsonString, // Send as stringified JSON string
        questions_count: data.qualification_questions.length,
        updated_at: new Date().toISOString(),
      };
      
      console.log('[Botpress Sync] Questions payload:');
      console.log('[Botpress Sync] Questions count:', data.qualification_questions.length);
      console.log('[Botpress Sync] Questions JSON string length:', questionsJsonString.length);
      console.log('[Botpress Sync] Payload:', JSON.stringify(questionsPayload, null, 2));
      
      syncResults.questions = await syncToTable(
        'qualification_questionsTable',
        [questionsPayload]
      );
    } else {
      console.log('[Botpress Sync] ⚠️ No qualification questions to sync');
      console.log('[Botpress Sync] Questions data check:', {
        has_questions: !!data.qualification_questions,
        is_array: Array.isArray(data.qualification_questions),
        length: data.qualification_questions?.length || 0
      });
      syncResults.questions = { success: true, inserted: 0, updated: 0 };
    }

    // 3. Sync FAQs
    console.log('[Botpress Sync] ========================================');
    console.log('[Botpress Sync] 3. Syncing FAQ Library');
    console.log('[Botpress Sync] ========================================');
    console.log('[Botpress Sync] FAQs count:', data.faqs?.length || 0);
    console.log('[Botpress Sync] FAQs data check:', {
      has_faqs: !!data.faqs,
      is_array: Array.isArray(data.faqs),
      length: data.faqs?.length || 0,
      faqs_preview: data.faqs?.slice(0, 2) || []
    });
    
    // Always sync FAQs (even if empty array) to ensure row exists in Botpress
    const faqsArray = data.faqs || [];
    
    // Ensure FAQs JSON is a string
    // The column type in Botpress is String, so we must send stringified JSON
    const faqsJsonString = JSON.stringify(faqsArray);
    
    console.log('[Botpress Sync] FAQs JSON string length:', faqsJsonString.length);
    console.log('[Botpress Sync] FAQs JSON preview:', faqsJsonString.substring(0, 200));
    console.log('[Botpress Sync] FAQs JSON type check:', typeof faqsJsonString);
    
    // Build payload - only include fields that exist in Botpress schema
    // Remove updated_at if it doesn't exist in the schema (based on error)
    // IMPORTANT: Ensure faqs_json is definitely a primitive string, not a JSON object
    // The Botpress API might auto-parse JSON strings, so we need to ensure type safety
    const faqsPayload: any = {
      organization_id: String(data.organization_id), // Ensure string
      faqs_json: String(faqsJsonString), // Force to string type - double ensure it's a string
      faqs_count: Number(faqsArray.length), // Ensure number
      // Note: removed updated_at as it's not in Botpress schema
    };
    
    // Final verification that faqs_json is a string
    if (typeof faqsPayload.faqs_json !== 'string') {
      console.error('[Botpress Sync] ERROR: faqs_json is not a string!', typeof faqsPayload.faqs_json);
      faqsPayload.faqs_json = JSON.stringify(faqsArray);
    }
    
    console.log('[Botpress Sync] FAQs payload:');
    console.log('[Botpress Sync] Payload:', JSON.stringify(faqsPayload, null, 2));
    console.log('[Botpress Sync] Organization ID:', data.organization_id);
    
    syncResults.faqs = await syncToTable(
      'faq_libraryTable',
      [faqsPayload]
    );
    
    if (!syncResults.faqs.success) {
      console.error('[Botpress Sync] ❌ FAQ sync failed:', syncResults.faqs.error);
      console.error('[Botpress Sync] Payload that failed:', JSON.stringify(faqsPayload, null, 2));
    } else {
      console.log('[Botpress Sync] ✅ FAQ sync result:', {
        success: syncResults.faqs.success,
        inserted: syncResults.faqs.inserted || 0,
        updated: syncResults.faqs.updated || 0
      });
    }

    // 4. Sync scheduling messages (tour confirmation and not qualified)
    console.log('[Botpress Sync] ========================================');
    console.log('[Botpress Sync] 4. Syncing Scheduling Messages');
    console.log('[Botpress Sync] ========================================');
    console.log('[Botpress Sync] Tour confirmation message length:', data.tour_confirmation_message?.length || 0);
    console.log('[Botpress Sync] Not qualified message length:', data.not_qualified_message?.length || 0);
    console.log('[Botpress Sync] Tour confirmation preview:', data.tour_confirmation_message?.substring(0, 80) + '...');
    console.log('[Botpress Sync] Not qualified preview:', data.not_qualified_message?.substring(0, 80) + '...');
    
    // Helper function to extract placeholders from message text
    const extractPlaceholders = (message: string): string[] => {
      const placeholderRegex = /\{([^}]+)\}/g;
      const matches = message.match(placeholderRegex);
      if (!matches) return [];
      
      // Extract placeholder names without curly braces
      return matches.map(match => match.replace(/[{}]/g, ''));
    };
    
    // Format scheduling messages as array of objects (consistent with questions and FAQs)
    const tourConfirmationMsg = data.tour_confirmation_message || '';
    const notQualifiedMsg = data.not_qualified_message || '';
    
    const schedulingMessagesArray = [
      {
        type: 'tour_confirmation',
        message: tourConfirmationMsg,
        placeholders: extractPlaceholders(tourConfirmationMsg)
      },
      {
        type: 'not_qualified',
        message: notQualifiedMsg,
        placeholders: extractPlaceholders(notQualifiedMsg)
      }
    ];
    
    // Store as JSON string (column type is String/Text)
    const schedulingMessagesJsonString = JSON.stringify(schedulingMessagesArray);
    
    console.log('[Botpress Sync] Scheduling messages array:', JSON.stringify(schedulingMessagesArray, null, 2));
    console.log('[Botpress Sync] Scheduling messages JSON string length:', schedulingMessagesJsonString.length);
    
    const schedulingMessagesPayload: any = {
      organization_id: String(data.organization_id),
      scheduling_messages_json: String(schedulingMessagesJsonString), // Force to string type
      scheduling_message_count: Number(schedulingMessagesArray.length), // Should be 2
      updated_at: new Date().toISOString(),
    };
    
    // Final verification that scheduling_messages_json is a string
    if (typeof schedulingMessagesPayload.scheduling_messages_json !== 'string') {
      console.error('[Botpress Sync] ERROR: scheduling_messages_json is not a string!', typeof schedulingMessagesPayload.scheduling_messages_json);
      schedulingMessagesPayload.scheduling_messages_json = JSON.stringify(schedulingMessagesArray);
    }
    
    console.log('[Botpress Sync] Scheduling messages payload:');
    console.log('[Botpress Sync] Payload:', JSON.stringify(schedulingMessagesPayload, null, 2));
    console.log('[Botpress Sync] Organization ID:', data.organization_id);
    
    syncResults.messages = await syncToTable(
      'scheduling_messagesTable',
      [schedulingMessagesPayload]
    );
    
    if (!syncResults.messages.success) {
      console.error('[Botpress Sync] ❌ Scheduling messages sync failed:', syncResults.messages.error);
      console.error('[Botpress Sync] Payload that failed:', JSON.stringify(schedulingMessagesPayload, null, 2));
    } else {
      console.log('[Botpress Sync] ✅ Scheduling messages sync result:', {
        success: syncResults.messages.success,
        inserted: syncResults.messages.inserted || 0,
        updated: syncResults.messages.updated || 0
      });
    }

    // Summary
    console.log('[Botpress Sync] ========================================');
    console.log('[Botpress Sync] 📋 SYNC SUMMARY');
    console.log('[Botpress Sync] ========================================');
    console.log('[Botpress Sync] Organization:', data.organization_id);
    console.log('[Botpress Sync] - Greeting:', syncResults.greeting.success ? '✅' : '❌');
    console.log('[Botpress Sync] - Questions:', syncResults.questions.success ? '✅' : '❌', `(${data.qualification_questions?.length || 0} questions)`);
    console.log('[Botpress Sync] - FAQs:', syncResults.faqs.success ? '✅' : '❌', `(${data.faqs?.length || 0} FAQs)`);
    console.log('[Botpress Sync] - Messages:', syncResults.messages.success ? '✅' : '❌');
    console.log('[Botpress Sync] ========================================');

    // Check if any critical sync failed
    const hasFailures = Object.values(syncResults).some(result => !result.success);
    
    if (hasFailures) {
      console.error('[Botpress Sync] ⚠️ Some syncs failed, but continuing...');
    } else {
      console.log('[Botpress Sync] ✅ All customizations synced successfully!');
      console.log('[Botpress Sync] Bot can now read all data from Botpress Tables!');
    }

    return {
      success: true,
      bot_id: BOTPRESS_AGENT_ID,
      details: {
        message: 'Bot customizations synced to Botpress Tables',
        sync_method: 'Botpress Tables API',
        organization_id: data.organization_id,
        results: syncResults,
        questions_count: data.qualification_questions?.length || 0,
        faqs_count: data.faqs?.length || 0,
      },
    };

  } catch (error) {
    console.error('[Botpress Sync] Error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during Botpress sync',
      details: {
        note: 'Configuration is saved in database but failed to sync to Botpress',
      },
    };
  }
}

/**
 * Build complete agent instructions with all customizations
 * This is for reference/logging only - not used in the Tables approach
 */
function buildAgentInstructions(data: BotCustomizationData): string {
  let instructions = '';

  instructions += `You are Alex, an AI leasing assistant for property management.\n`;
  instructions += `Your primary task is to engage with prospective tenants via SMS to qualify them, answer their questions, and schedule property tours.\n\n`;

  instructions += `## Greeting\n\n`;
  instructions += `Use the greeting from {{workflow.customGreeting}}\n`;
  instructions += `Replace placeholders:\n`;
  instructions += `- {prospect_name} with the lead's first name\n`;
  instructions += `- {bot_name} with "Alex"\n`;
  instructions += `- {property_name} with the property name from conversation context\n\n`;

  instructions += `## Qualification Questions\n\n`;
  instructions += `Ask the qualification questions provided in {{workflow.qualificationQuestions}}.\n`;
  instructions += `Ask one question at a time, in the order specified.\n`;
  instructions += `Save each answer to the appropriate conversation variable.\n\n`;

  instructions += `## Question Handling\n\n`;
  instructions += `Answer questions using your Knowledge Base (FAQs and property details).\n`;
  instructions += `After answering, gently guide the conversation back to qualification or scheduling.\n\n`;

  instructions += `## Tour Confirmation Message\n\n`;
  instructions += `Use: {{workflow.tourConfirmation}}\n`;
  instructions += `Replace placeholders with actual booking details.\n\n`;

  instructions += `## Not Qualified Response\n\n`;
  instructions += `Use: {{workflow.notQualified}}\n`;
  instructions += `Be polite and professional when delivering this message.\n\n`;

  instructions += `## Style Guidelines\n\n`;
  instructions += `- Be conversational and friendly (use contractions, casual language)\n`;
  instructions += `- Maintain professionalism throughout\n`;
  instructions += `- Keep messages brief and concise (this is SMS)\n`;
  instructions += `- Ask one question at a time\n`;
  instructions += `- If unsure about property details, offer to have a manager follow up\n\n`;

  return instructions;
}
