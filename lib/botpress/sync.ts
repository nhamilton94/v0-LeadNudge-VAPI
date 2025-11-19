import { QualificationQuestion, FAQ } from '@/types/bot-customization';

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

    // Sync greeting to Botpress Tables using correct API format
    // Reference: https://www.botpress.com/docs/api-reference/tables-api/openapi/endpoints/post-v1tables-rowsupsert
    console.log('[Botpress Sync] Syncing greeting to Botpress Tables...');
    
    try {
      // Botpress Tables API endpoint (correct format from official docs)
      // Note: Botpress adds "Table" suffix automatically, so "bot_greetings" becomes "bot_greetingsTable"
      const tableName = 'bot_greetingsTable';
      const tablesApiUrl = `https://api.botpress.cloud/v1/tables/${tableName}/rows/upsert`;
      
      // Correct payload format according to Botpress documentation
      const payload = {
        rows: [
          {
            organization_id: data.organization_id,
            greeting_message: data.greeting_message,
            updated_at: new Date().toISOString(),
          }
        ],
        keyColumn: 'organization_id', // Use organization_id as the key for upsert
        waitComputed: false // Don't wait for computed columns
      };

      console.log('[Botpress Sync] API URL:', tablesApiUrl);
      console.log('[Botpress Sync] Payload:', JSON.stringify(payload, null, 2));

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
      console.log('[Botpress Sync] Response status:', response.status);
      console.log('[Botpress Sync] Response body:', responseText);

      if (!response.ok) {
        console.error('[Botpress Sync] ❌ Failed to sync to Botpress Tables');
        console.error('[Botpress Sync] Status:', response.status);
        console.error('[Botpress Sync] Error:', responseText);
        
        return {
          success: false,
          error: 'Failed to sync to Botpress Tables',
          details: {
            status: response.status,
            error: responseText,
            note: 'Make sure bot_greetingsTable exists in Botpress Studio with columns: organization_id (Text, Primary Key), greeting_message (Text), updated_at (DateTime)'
          }
        };
      }

      const result = JSON.parse(responseText);
      console.log('[Botpress Sync] ✅ Greeting synced to Botpress Tables successfully!');
      console.log('[Botpress Sync] ');
      console.log('[Botpress Sync] 📋 Summary:');
      console.log('[Botpress Sync] - Organization:', data.organization_id);
      console.log('[Botpress Sync] - Greeting:', data.greeting_message.substring(0, 80) + '...');
      console.log('[Botpress Sync] - Inserted:', result.inserted?.length || 0, 'row(s)');
      console.log('[Botpress Sync] - Updated:', result.updated?.length || 0, 'row(s)');
      console.log('[Botpress Sync] - Table: bot_greetingsTable');
      console.log('[Botpress Sync] ');
      console.log('[Botpress Sync] ✅ Bot can now read greeting directly from Tables!');

      return {
        success: true,
        bot_id: BOTPRESS_AGENT_ID,
        details: {
          message: 'Greeting synced to Botpress Tables',
          sync_method: 'Botpress Tables API',
          table: 'bot_greetingsTable',
          organization_id: data.organization_id,
          inserted: result.inserted?.length || 0,
          updated: result.updated?.length || 0,
        },
      };

    } catch (error) {
      console.error('[Botpress Sync] Error syncing to Botpress Tables:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          note: 'Make sure BOTPRESS_TOKEN and BOTPRESS_AGENT_ID are set correctly, and bot_greetingsTable exists in Botpress Studio'
        }
      };
    }

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
