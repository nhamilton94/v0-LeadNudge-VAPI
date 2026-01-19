import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      webhookUrl: z.string().describe('The url to post the bot answers to.'),
    }),
  },
  states: {
    contactContext: {
      type: 'conversation',
      schema: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        fullName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        contactId: z.string().optional(),
      }),
    },
  },
  channels: {
    webhook: {
      conversation: {
        tags: {
          id: { title: 'Conversation ID', description: 'The ID of the conversation' },
        },
      },
      messages: {
        // this channel only supports text messages
        text: {
          schema: z.object({
            text: z.string(),
          }),
        },
        choice: { 
          schema: z.object({
            text: z.string().optional(), // prompt text
            choices: z.array(
              z.object({
                id: z.string(),  // internal ID
                label: z.string() // what the user sees
              })
            ),
          }),
        }
      },
    },
  },
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user' },
    },
  },
})
