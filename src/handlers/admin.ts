import { redis } from '..'
import { CHANNEL_ID } from '../env'
import { confessionPrefix } from '../services/broadcast'
import type { BotContext } from './confession'
import type { Bot } from 'grammy'
import type { Message } from 'grammy/types'

export function registerAdminHandlers(bot: Bot<BotContext>) {
  bot.callbackQuery('approve', async (ctx) => {
    const msg = ctx.callbackQuery.message as
      | Message.TextMessage
      | Message.PhotoMessage
      | undefined
    if (!msg) {
      await ctx.answerCallbackQuery()
      return
    }

    let confessionText: string
    let fileId: string | undefined

    if ('photo' in msg) {
      confessionText = (msg.caption ?? '').replace(confessionPrefix, '')
      fileId = msg.photo.at(-1)!.file_id
    } else {
      confessionText = msg.text.replace(confessionPrefix, '')
    }

    if (fileId) {
      await ctx.api.sendPhoto(CHANNEL_ID, fileId, { caption: confessionText })
      await ctx.editMessageCaption({
        caption: `✅ <b>Approved:</b>\n\n${confessionText}`,
        parse_mode: 'HTML',
      })
    } else {
      await ctx.api.sendMessage(CHANNEL_ID, confessionText)
      await ctx.editMessageText(`✅ <b>Approved:</b>\n\n${confessionText}`, {
        parse_mode: 'HTML',
      })
    }

    await redis.lpush('recent_confessions', confessionText)
    await redis.ltrim('recent_confessions', 0, 49)

    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery('reject', async (ctx) => {
    const msg = ctx.callbackQuery.message as
      | Message.TextMessage
      | Message.PhotoMessage
      | undefined
    if (!msg) {
      await ctx.answerCallbackQuery()
      return
    }

    const confessionText = (
      'photo' in msg ? (msg.caption ?? '') : msg.text
    ).replace(confessionPrefix, '')

    if ('photo' in msg) {
      await ctx.editMessageCaption({
        caption: `❌ <b>Rejected:</b>\n\n${confessionText}`,
        parse_mode: 'HTML',
      })
    } else {
      await ctx.editMessageText(`❌ <b>Rejected:</b>\n\n${confessionText}`, {
        parse_mode: 'HTML',
      })
    }
    await ctx.answerCallbackQuery()
  })
}
