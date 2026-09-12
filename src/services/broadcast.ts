import { ADMIN_GROUP_ID, CHANNEL_ID } from '../env'
import { approvalKeyboard } from '../handlers/keyboard'
import { bot } from '../bot'

export const confessionPrefix = '📝 **wei wei wei ada confession baru**\n\n'

export async function broadcastToChannel(text: string) {
  await bot.api.sendMessage(CHANNEL_ID, text)
}

export async function broadcastToAdmin(text: string) {
  await bot.api.sendMessage(ADMIN_GROUP_ID, `${confessionPrefix}${text}`, {
    reply_markup: approvalKeyboard,
    parse_mode: 'Markdown',
  })
}
