import { bot } from '../bot'
import { ADMIN_GROUP_ID } from '../env'
import { approvalKeyboard } from '../handlers/keyboard'

export const confessionPrefix = '📝 wei wei wei ada confession baru\n\n'

export async function broadcastToAdmin(text: string) {
  await bot.api.sendMessage(ADMIN_GROUP_ID, `${confessionPrefix}${text}`, {
    reply_markup: approvalKeyboard,
    parse_mode: 'HTML',
  })
}
