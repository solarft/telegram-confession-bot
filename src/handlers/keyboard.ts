import { InlineKeyboard, Keyboard } from 'grammy'

export const defaultKeyboard = new Keyboard()
  .text('🗣️ New confession')
  .row()
  .text('💬 Reply to a confession')
  .row()
  .text('❓ How to confess/reply')
  .resized()

export const approvalKeyboard = new InlineKeyboard()
  .text('✅ Approve', 'approve')
  .text('❌ Reject', 'reject')
