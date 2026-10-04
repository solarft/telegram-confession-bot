import { bot } from '../bot'
import { ADMIN_GROUP_ID } from '../env'
import { approvalKeyboard } from '../handlers/keyboard'
import type { Message } from 'grammy/types'

export const confessionPrefix = '📝 wei wei wei ada confession baru\n\n'

export async function broadcastToAdmin(
  message: Message.TextMessage | Message.PhotoMessage,
  text?: string,
) {
  if ('photo' in message) {
    await bot.api.sendPhoto(ADMIN_GROUP_ID, message.photo.at(-1)!.file_id, {
      caption: `${confessionPrefix}${text ?? `🗣️ ${message.caption ?? ''}`}`,
      reply_markup: approvalKeyboard,
      parse_mode: 'HTML',
    })
    return
  }

  await bot.api.sendMessage(
    ADMIN_GROUP_ID,
    `${confessionPrefix}${text ?? `🗣️ ${message.text}`}`,
    { reply_markup: approvalKeyboard, parse_mode: 'HTML' },
  )
}
