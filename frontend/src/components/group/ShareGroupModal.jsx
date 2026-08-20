import { useState, useEffect } from 'react'
import Modal from '../shared/Modal'
import { groupService } from '../../services/group.service'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { Copy, Check, MessageCircle } from 'lucide-react'
import { cn } from '../../lib/cn'
import toast from 'react-hot-toast'

export default function ShareGroupModal({ isOpen, onClose, group }) {
  const [inviteLink, setInviteLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && group?._id) {
      setLoading(true)
      groupService.generateInvite(group._id)
        .then((res) => {
          setInviteLink(res.data.inviteLink)
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || 'Failed to generate invite')
          onClose()
        })
        .finally(() => setLoading(false))
    } else {
      setInviteLink('')
    }
  }, [isOpen, group])

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const text = `Join my expense group "${group.name}" on SettleUp!\n\n${inviteLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Invite Link">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-[#6b7280] text-sm">Generating secure link...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <QRCode value={inviteLink} size={180} level="M" />
          </div>

          <p className="text-[13px] text-[#6b7280] text-center max-w-[260px]">
            Scan the QR code or share the link below to invite members to the group.
          </p>

          <div className="w-full flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl bg-[#252525] hover:bg-[#2e2e2e] transition-colors"
            >
              {copied ? <Check size={20} className="text-accent-green" /> : <Copy size={20} className="text-white" />}
              <span className={cn('text-[12px] font-medium', copied ? 'text-accent-green' : 'text-white')}>
                {copied ? 'Copied' : 'Copy link'}
              </span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 transition-colors"
            >
              <MessageCircle size={20} className="text-[#25d366]" />
              <span className="text-[12px] font-medium text-[#25d366]">
                WhatsApp
              </span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
