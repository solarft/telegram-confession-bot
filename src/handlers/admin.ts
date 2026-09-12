import { CHANNEL_ID } from '../env'
import { bot } from '../index'
import { confessionPrefix } from '../services/broadcast'

bot.callbackQuery('approve', async (ctx) => {
  const fullText = ctx.callbackQuery.message?.text || ''
  const confessionText = fullText.replace(confessionPrefix, '')

  await ctx.api.sendMessage(CHANNEL_ID, confessionText)

  await ctx.editMessageText(`**Approved:**\n\n${confessionText}`)
  await ctx.answerCallbackQuery()
})

bot.callbackQuery('reject', async (ctx) => {
  const fullText = ctx.callbackQuery.message?.text || ''
  const confessionText = fullText.replace(confessionPrefix, '')

  await ctx.editMessageText(`**Approved:**\n\n${confessionText}`)
  await ctx.answerCallbackQuery()
})
