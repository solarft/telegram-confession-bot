import { redis } from '..'
import { CHANNEL_ID } from '../env'
import { confessionPrefix } from '../services/broadcast'
import type { BotContext } from './confession'
import type { Bot } from 'grammy'

export function registerAdminHandlers(bot: Bot<BotContext>) {
  bot.callbackQuery('approve', async (ctx) => {
    const fullText = ctx.callbackQuery.message?.text || ''
    const confessionText = fullText.replace(confessionPrefix, '')

    await ctx.api.sendMessage(CHANNEL_ID, confessionText)

    await redis.lpush('recent_confessions', confessionText.slice(0, 40))
    await redis.ltrim('recent_confessions', 0, 49)

    await ctx.editMessageText(`**Approved:**\n\n${confessionText}`, {
      parse_mode: 'Markdown',
    })
    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery('reject', async (ctx) => {
    const fullText = ctx.callbackQuery.message?.text || ''
    const confessionText = fullText.replace(confessionPrefix, '')

    await ctx.editMessageText(`**Rejected:**\n\n${confessionText}`, {
      parse_mode: 'Markdown',
    })
    await ctx.answerCallbackQuery()
  })
}
