import {
  conversations,
  createConversation,
  type ConversationData,
  type ConversationStorage,
  type VersionedState,
} from '@grammyjs/conversations'
import { Bot, session } from 'grammy'
import { BOT_TOKEN, HELP_PHOTO_ID } from './env'
import { registerAdminHandlers } from './handlers/admin'
import * as commands from './handlers/commands'
import {
  replyConfession,
  submitConfession,
  type BotContext,
} from './handlers/confession'
import { defaultKeyboard } from './handlers/keyboard'
import { redis } from './redis'

export const bot = new Bot<BotContext>(BOT_TOKEN)

// The plugin's default storage is an in-memory Map that dies with the lambda
// instance. On serverless, a reply typed minutes after the prompt can land on
// a fresh instance with no conversation state and get silently dropped, so the
// state lives in Redis (keyed by chat id) instead.
const conversationStorage: ConversationStorage<BotContext, ConversationData> = {
  type: 'key',
  prefix: 'conversation:',
  adapter: {
    read: async (key) =>
      (await redis.get<VersionedState<ConversationData>>(key)) ?? undefined,
    write: async (key, state) => {
      await redis.set(key, state)
    },
    delete: async (key) => {
      await redis.del(key)
    },
  },
}

bot.use(session({ initial: () => ({}) }))
bot.use(conversations({ storage: conversationStorage }))
bot.use(createConversation(submitConfession, 'submitConfession'))
bot.use(createConversation(replyConfession, 'replyConfession'))

// Log the real cause instead of letting errors escape as unhandled 500s —
// which Telegram would treat as a dead webhook and re-deliver the same
// update on top of the original failure.
bot.catch((error) => {
  const cause = error.error as Error
  console.error('bot error:', cause, '\ncause:', cause?.cause)
})

bot.command('start', commands.start)
bot.hears('🗣️ New confession', (ctx) =>
  ctx.conversation.enter('submitConfession'),
)
bot.hears('💬 Reply to a confession', (ctx) =>
  ctx.conversation.enter('replyConfession'),
)
bot.hears('❓ How to confess/reply', (ctx) =>
  ctx.replyWithPhoto(HELP_PHOTO_ID, {
    caption:
      '🗣️ Confesss:\nUse the reply keyboard to begin submitting confessions for approval.\n\n💬 Reply: \nNo need to copy and paste a confession. Just click the reply button and select which confession you would like to reply to.',
    reply_markup: defaultKeyboard,
  }),
)

registerAdminHandlers(bot)
