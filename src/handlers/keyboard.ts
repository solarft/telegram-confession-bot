import { InlineKeyboard, Keyboard } from 'grammy'

const emptyMarkup = new InlineKeyboard()

export const defaultKeyboard = new Keyboard()
  .text('🗣️ New confession')
  .row()
  .text('💬 Reply to a confession')
  .row()
  .text('❓ How to confess/reply')
  .resized()

/**
 * Tally lives in the button labels and is always derived from the sets —
 * never read from any stored number.
 */
export function approvalKeyboard(approves = 0, rejects = 0) {
  return new InlineKeyboard()
    .text(`✅ Approve (${approves})`, 'approve')
    .text(`❌ Reject (${rejects})`, 'reject')
}

/** Pass this as `reply_markup` when finalizing a message: clears the buttons. */
export const clearApprovalMarkup = emptyMarkup
