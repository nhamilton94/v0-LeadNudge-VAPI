import { Client } from '@botpress/client';
import { QualificationQuestion, FAQ } from '@/types/bot-customization';

// Botpress Admin API Configuration
// Reference: https://www.botpress.com/docs/api-reference/admin-api/getting-started
const BOTPRESS_ADMIN_API_URL = 'https://api.botpress.cloud/v1/admin';
// Admin API requires Personal Access Token (bp_pat_...), not Bot API Key (bp_bak_...)
const BOTPRESS_TOKEN = process.env.BOTPRESS_TOKEN || process.env.BOTPRESS_PAT;
const BOTPRESS_BOT_ID = process.env.BOTPRESS_BOT_ID;
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
 * Sync bot customization settings to Botpress using Admin API
 * Reference: https://www.botpress.com/docs/api-reference/admin-api/getting-started
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
        error: 'Missing BOTPRESS_TOKEN in environment variables. Need Personal Access Token (bp_pat_...), not Bot API Key (bp_bak_...)',
      };
    }

    // Verify token type
    if (BOTPRESS_TOKEN.startsWith('bp_bak_')) {
      return {
        success: false,
        error: 'BOTPRESS_TOKEN must be a Personal Access Token (bp_pat_...), not a Bot API Key (bp_bak_...). Please create a PAT in Botpress Dashboard.',
      };
    }

    if (!BOTPRESS_BOT_ID) {
      return {
        success: false,
        error: 'Missing BOTPRESS_BOT_ID in environment variables',
      };
    }

    if (!BOTPRESS_WORKSPACE_ID) {
      return {
        success: false,
        error: 'Missing BOTPRESS_WORKSPACE_ID in environment variables',
      };
    }

    console.log('[Botpress Sync] Credentials validated');

    // Format bot configuration payload
    // Build the instructions text with all customizations
    const instructionsText = buildBotInstructions(data);

    console.log('[Botpress Sync] Fetching current bot configuration...');

    // First, fetch the current bot to get its full structure
    const getResponse = await fetch(`${BOTPRESS_ADMIN_API_URL}/bots/${BOTPRESS_BOT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BOTPRESS_TOKEN}`,
        'x-workspace-id': BOTPRESS_WORKSPACE_ID,
      },
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('[Botpress Sync] Failed to fetch bot:', getResponse.status, errorText);
      return {
        success: false,
        error: `Failed to fetch bot: ${getResponse.status}`,
        details: { message: errorText },
      };
    }

    const currentBot = await getResponse.json();
    console.log('[Botpress Sync] Current bot fetched successfully');

    // Get current instructions
    const currentInstructions = currentBot.bot?.configuration?.instructions || '';
    
    // Merge customizations with existing instructions
    const mergedInstructions = mergeCustomizationsWithInstructions(currentInstructions, instructionsText);

    // Update only the instructions in the existing configuration
    const updatedBot = {
      ...currentBot.bot,
      configuration: {
        ...(currentBot.bot.configuration || {}),
        instructions: mergedInstructions,
      },
    };

    console.log('[Botpress Sync] Updating bot via Admin API...');
    console.log('[Botpress Sync] Instructions length:', instructionsText.length, 'characters');

    // Call Botpress Admin API to update bot configuration with full bot object
    const response = await fetch(`${BOTPRESS_ADMIN_API_URL}/bots/${BOTPRESS_BOT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BOTPRESS_TOKEN}`,
        'x-workspace-id': BOTPRESS_WORKSPACE_ID,
      },
      body: JSON.stringify(updatedBot),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Botpress Sync] Admin API error:', response.status, errorText);
      
      // Try to parse error details
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }

      return {
        success: false,
        error: `Botpress Admin API returned ${response.status}`,
        details: {
          status: response.status,
          message: errorDetails,
          note: 'Check that BOT_ID, WORKSPACE_ID, and TOKEN are correct',
        },
      };
    }

    const result = await response.json();
    console.log('[Botpress Sync] Bot updated successfully!');

    return {
      success: true,
      bot_id: BOTPRESS_BOT_ID,
      details: {
        message: 'Bot configuration synced successfully via Admin API',
        updated_fields: ['instructions'],
        bot: result.bot,
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
 * Merge our customizations with existing Botpress instructions
 * Removes any previous customization sections and prepends the new ones
 */
function mergeCustomizationsWithInstructions(currentInstructions: string, customizations: string): string {
  // Remove previous customization sections if they exist
  // Look for our marker: "## ADMIN CUSTOMIZATIONS - START"
  const startMarker = '## ADMIN CUSTOMIZATIONS - START';
  const endMarker = '## ADMIN CUSTOMIZATIONS - END';
  
  let cleanedInstructions = currentInstructions;
  
  const startIndex = currentInstructions.indexOf(startMarker);
  const endIndex = currentInstructions.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1) {
    // Remove old customizations (including the end marker and its newline)
    cleanedInstructions = 
      currentInstructions.substring(0, startIndex) + 
      currentInstructions.substring(endIndex + endMarker.length).replace(/^\n+/, '');
  }
  
  // Prepend new customizations with markers
  const mergedInstructions = 
    `${startMarker}\n\n` +
    customizations +
    `\n${endMarker}\n\n` +
    cleanedInstructions;
  
  return mergedInstructions;
}

/**
 * Build customization sections that will be merged with existing instructions
 * We don't replace the entire instructions - only the parts admin can customize:
 * 1. Introduction greeting message
 * 2. Qualification questions
 * 3. FAQs (if any)
 * 4. Tour confirmation message
 * 5. Not qualified message
 */
function buildBotInstructions(data: BotCustomizationData): string {
  let instructions = `# 🎯 ADMIN CUSTOMIZATIONS\n`;
  instructions += `These settings override the default bot behavior and are managed from the Admin Settings panel.\n\n`;
  
  // 1. Greeting Message
  instructions += `### 1. Introduction Message\n`;
  instructions += `**Use this exact message when starting a conversation:**\n\n`;
  instructions += `"${data.greeting_message}"\n\n`;
  instructions += `Replace placeholders:\n`;
  instructions += `- {prospect_name} → Lead's first name\n`;
  instructions += `- {bot_name} → Alex\n`;
  instructions += `- {property_name} → Property name from conversation context\n\n`;
  
  // 2. Qualification Questions
  instructions += `### 2. Qualification Questions\n`;
  if (data.qualification_questions.length > 0) {
    instructions += `**Ask these questions in this exact order:**\n\n`;
    
    data.qualification_questions
      .sort((a, b) => a.order_index - b.order_index)
      .forEach((q, index) => {
        instructions += `**Q${index + 1}:** "${q.question_text}"\n`;
        instructions += `- Type: ${q.answer_type}\n`;
        if (q.is_required) {
          instructions += `- Required: Yes\n`;
        }
        if (q.disqualifier_rule) {
          instructions += `- Disqualify if: ${q.disqualifier_rule}\n`;
        }
        if (q.multiple_choice_options && q.multiple_choice_options.length > 0) {
          instructions += `- Options: ${q.multiple_choice_options.join(', ')}\n`;
        }
        instructions += '\n';
      });
  } else {
    instructions += `No custom qualification questions configured. Use default qualification flow.\n\n`;
  }

  // 3. FAQs
  instructions += `### 3. FAQ Library\n`;
  if (data.faqs.length > 0) {
    instructions += `**Use these FAQs to answer common questions:**\n\n`;
    
    data.faqs.forEach((faq, index) => {
      instructions += `**Q:** ${faq.question}\n`;
      instructions += `**A:** ${faq.answer}\n\n`;
    });
  } else {
    instructions += `No FAQs configured. Use general property knowledge to answer questions.\n\n`;
  }

  // 4. Tour Confirmation Message
  instructions += `### 4. Tour Confirmation Message\n`;
  instructions += `**When a tour is successfully scheduled, send this message:**\n\n`;
  instructions += `"${data.tour_confirmation_message}"\n\n`;
  instructions += `Replace placeholders with actual data.\n\n`;

  // 5. Not Qualified Message
  instructions += `### 5. Not Qualified Message\n`;
  instructions += `**If a prospect does not meet qualification criteria, send:**\n\n`;
  instructions += `"${data.not_qualified_message}"\n\n`;
  instructions += `Replace placeholders with actual data.\n\n`;

  instructions += `---\n\n`;

  return instructions;
}

/**
 * Test Botpress connection
 */
export async function testBotpressConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    if (!BOT_API_KEY) {
      return {
        connected: false,
        error: 'BOT_API_KEY not configured',
      };
    }

    const response = await fetch(`${BOTPRESS_API_URL}/v1/health`, {
      headers: {
        'Authorization': `Bearer ${BOT_API_KEY}`,
      },
    });

    return {
      connected: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };

  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

