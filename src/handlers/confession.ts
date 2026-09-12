import { broadcastToAdmin } from '../services/broadcast'
import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import type { Context } from 'grammy'

export type BotContext = Context & ConversationFlavor<Context>
export type BotConversation = Conversation<BotContext>

export async function submitConfession(
  conversation: BotConversation,
  ctx: BotContext,
) {
  await ctx.reply('Please send your confession text')
  const confessionCtx = await conversation.waitFor('message:text')
  const confessionText = confessionCtx.message.text

  try {
    await broadcastToAdmin(confessionText)
    await ctx.reply('Your confession has been sent for approval!')
  } catch {
    await ctx.reply('amalakkkk. sum ting went rong la. try agen leter ok')
  }
}
