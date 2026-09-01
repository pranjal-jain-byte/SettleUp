import { useState, useEffect } from 'react'
import { groupService } from '../../services/group.service'
import { settlementService } from '../../services/settlement.service'
import { cn } from '../../lib/cn'
import { ArrowRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatUsername, getInitials } from '../../utils/format'
import toast from 'react-hot-toast'

function formatAmount(val) {
  return Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function BalancesTab({ groupId, user, data: propData, loading: propLoading, error: propError, refetch: propRefetch }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  // Settle Up Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false)
  const [settleTarget, setSettleTarget] = useState(null)
  const [isSettling, setIsSettling] = useState(false)
  const [settleNote, setSettleNote] = useState('')
  const [settleAmount, setSettleAmount] = useState('')

  const fetchSettlements = () => {
    if (propRefetch) {
      propRefetch()
    } else {
      setLoading(true)
      setError(false)
      groupService.getSettlement(groupId)
        .then((res) => setData(res.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => {
    if (propData !== undefined) {
      setData(propData)
      setLoading(propLoading)
      setError(propError)
    } else {
      fetchSettlements()
    }
  }, [groupId, propData, propLoading, propError])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse px-2">
        <div className="bg-[#1e1e1e] rounded-2xl h-[120px] border border-white/[0.06]"></div>
        <div>
          <div className="h-4 bg-[#1e1e1e] rounded w-32 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="bg-[#1e1e1e] rounded-2xl h-[72px] border border-white/[0.06]"></div>)}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <p className="text-sm text-[#6b7280] mb-4">Couldn't load balances. Tap to retry.</p>
        <button 
          onClick={fetchSettlements}
          className="px-4 py-2 rounded-lg bg-[#252525] text-white text-sm hover:bg-[#2e2e2e] border border-white/[0.06] transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const transactions = data?.transactions || []
  const memberStats = data?.memberStats || []
  const totalSpendings = data?.totalGroupSpendings || 0
  const currentUserId = user?._id

  if (transactions.length === 0 && memberStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <p className="text-sm text-[#6b7280]">No expenses yet. Add one to see balances.</p>
      </div>
    )
  }

  // Find my stats
  const myStats = memberStats.find(m => m.user._id === currentUserId) || { netBalance: 0, totalPaid: 0 }
  const netBalance = myStats.netBalance
  const totalPaid = myStats.totalPaid

  const mySettlements = transactions.filter(t => t.from?._id === currentUserId || t.to?._id === currentUserId)

  const handleSettleClick = (transaction) => {
    setSettleTarget(transaction)
    setSettleAmount(transaction.amount.toString())
    setSettleNote('')
    setSettleModalOpen(true)
  }

  const confirmSettle = async () => {
    if (!settleTarget || isSettling) return

    const amt = parseFloat(settleAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid amount greater than 0')
      return
    }

    setIsSettling(true)
    try {
      // 1. Create order on the backend
      const orderRes = await settlementService.createRazorpayOrder(amt);
      const { order, key_id } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "SettleUp",
        description: `Settling up with ${formatUsername(settleTarget.to)}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify payment on the backend
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              groupId,
              toUserId: settleTarget.to._id,
              amount: amt,
              note: settleNote
            };
            
            await settlementService.verifyRazorpayPayment(verifyPayload);
            toast.success('Settlement recorded successfully!');
            setSettleModalOpen(false);
            fetchSettlements();
          } catch (verifyErr) {
            toast.error(verifyErr.response?.data?.message || 'Payment verification failed');
            console.error(verifyErr);
          }
        },
        prefill: {
          name: formatUsername(user),
          email: user?.email || ""
        },
        theme: {
          color: "#22c55e"
        }
      };
      
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response){
        toast.error(response.error.description || 'Payment failed');
      });
      
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment')
      console.error(err)
    } finally {
      setIsSettling(false)
    }
  }

  return (
    <div className="space-y-8 pb-8">
      {/* SECTION 1: Your Net Balance */}
      <div className="bg-[#1e1e1e] border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center justify-center text-center mx-1">
        {netBalance === 0 ? (
          <p className="text-base text-[#6b7280]">You're all settled up</p>
        ) : (
          <>
            <p className="text-sm text-[#6b7280] mb-2">
              {netBalance < 0 ? 'You owe' : 'You are owed'}
            </p>
            <p className={cn("text-3xl font-medium", netBalance < 0 ? "text-[#ef4444]" : "text-[#22c55e]")}>
              ₹{formatAmount(netBalance)}
            </p>
          </>
        )}
        <p className="text-[13px] text-[#6b7280] mt-4">
          You've paid ₹{formatAmount(totalPaid)} total in this group
        </p>
      </div>

      {/* SECTION 2: Your Settlements */}
      <div className="mx-1">
        <h3 className="text-[13px] font-medium text-[#6b7280] uppercase tracking-[0.08em] mb-4">
          Your Settlements
        </h3>
        
        {mySettlements.length === 0 ? (
          <p className="text-sm text-[#6b7280] text-center py-6">You're all settled up</p>
        ) : (
          <div className="space-y-2">
            {mySettlements.map((t, idx) => {
              const iOwe = t.from?._id === currentUserId
              const otherUser = iOwe ? t.to : t.from
              
              return (
                <div key={idx} className="flex items-center gap-3 bg-[#1e1e1e] border border-white/[0.06] rounded-2xl p-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#252525]",
                    iOwe ? "text-[#ef4444]" : "text-[#22c55e]"
                  )}>
                    {iOwe ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  
                  <div className="w-7 h-7 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {otherUser?.avatar ? (
                      <img src={otherUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-medium text-[#6b7280]">{getInitials(formatUsername(otherUser))}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-white truncate">
                      {iOwe ? `You pay ${formatUsername(otherUser)}` : `${formatUsername(otherUser)} pays you`}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={cn("text-[15px] font-medium", iOwe ? "text-[#ef4444]" : "text-[#22c55e]")}>
                      ₹{formatAmount(t.amount)}
                    </span>
                    
                    {iOwe && (
                      <button
                        onClick={() => handleSettleClick(t)}
                        className="px-3 py-1 rounded-lg border border-[#22c55e] text-[#22c55e] text-[12px] font-medium hover:bg-[#22c55e]/10 transition-colors"
                      >
                        Settle up
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: All Group Transactions */}
      <div className="mx-1">
        <h3 className="text-[13px] font-medium text-[#6b7280] uppercase tracking-[0.08em] mb-4">
          All Transactions
        </h3>
        
        <div className="space-y-0.5">
          {transactions.map((t, idx) => {
            const involvesMe = t.from?._id === currentUserId || t.to?._id === currentUserId
            
            return (
              <div 
                key={idx} 
                className={cn(
                  "flex items-center justify-between p-3 transition-colors",
                  involvesMe 
                    ? "bg-[#252525] border border-white/[0.06] rounded-xl my-1" 
                    : "border-b border-white/[0.06] last:border-0 rounded-none"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {t.from?.avatar ? <img src={t.from.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] text-[#6b7280]">{getInitials(formatUsername(t.from))}</span>}
                  </div>
                  
                  <span className={cn("text-sm truncate", involvesMe ? "text-white" : "text-[#6b7280]")}>
                    {formatUsername(t.from)}
                  </span>
                  
                  <ArrowRight className="text-[#6b7280] w-3.5 h-3.5 flex-shrink-0 mx-0.5" />
                  
                  <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {t.to?.avatar ? <img src={t.to.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] text-[#6b7280]">{getInitials(formatUsername(t.to))}</span>}
                  </div>
                  
                  <span className={cn("text-sm truncate", involvesMe ? "text-white" : "text-[#6b7280]")}>
                    {formatUsername(t.to)}
                  </span>
                </div>

                <span className={cn("text-sm ml-3 flex-shrink-0", involvesMe ? "text-white" : "text-[#6b7280]")}>
                  ₹{formatAmount(t.amount)}
                </span>
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <p className="text-[13px] text-[#6b7280]">
            Total group spending: ₹{formatAmount(totalSpendings)}
          </p>
        </div>
      </div>

      {/* SECTION 4: Member Stats */}
      <div className="mx-1">
        <h3 className="text-[13px] font-medium text-[#6b7280] uppercase tracking-[0.08em] mb-4">
          Members
        </h3>
        
        <div className="space-y-2">
          {memberStats.map((stat) => {
            const isMe = stat.user._id === currentUserId
            
            return (
              <div 
                key={stat.user._id} 
                className={cn(
                  "flex items-center gap-4 bg-[#1e1e1e] border border-white/[0.06] rounded-2xl p-4",
                  isMe && "border-white/[0.12]" // slightly brighter border for current user
                )}
              >
                <div className="w-10 h-10 rounded-full bg-[#e5e7eb] text-[#9ca3af] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {stat.user.avatar ? (
                    <img src={stat.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[15px] font-medium text-[#4b5563]">{getInitials(formatUsername(stat.user))}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-medium text-white truncate">
                    {formatUsername(stat.user)}
                  </p>
                  {isMe && (
                    <p className="text-[13px] text-[#6b7280] mt-0.5">Me</p>
                  )}
                </div>

                <div className="flex items-center flex-shrink-0">
                  <span className={cn(
                    "text-[16px] font-medium",
                    stat.netBalance > 0 ? "text-[#22c55e]" : stat.netBalance < 0 ? "text-[#ef4444]" : "text-[#6b7280]"
                  )}>
                    {stat.netBalance > 0 ? `+₹${formatAmount(stat.netBalance)}` : stat.netBalance < 0 ? `-₹${formatAmount(Math.abs(stat.netBalance))}` : '₹0.00'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Minimal Settle Up Bottom Sheet / Modal */}
      {settleModalOpen && settleTarget && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-40 animate-overlay-in"
            onClick={() => !isSettling && setSettleModalOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e1e1e] border-t border-white/[0.06] rounded-t-2xl p-6 animate-fab-menu-in shadow-2xl">
            <div className="max-w-md mx-auto">
              <h3 className="text-[15px] font-medium text-white mb-6 text-center">
                Settling with {formatUsername(settleTarget.to)}
              </h3>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1.5 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={isSettling}
                    className="w-full bg-[#0f1010] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#22c55e]/50 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1.5 uppercase tracking-wider">Note (Optional)</label>
                  <input
                    type="text"
                    value={settleNote}
                    onChange={(e) => setSettleNote(e.target.value)}
                    placeholder="Add a note..."
                    disabled={isSettling}
                    className="w-full bg-[#0f1010] border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#22c55e]/50 transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSettleModalOpen(false)}
                  disabled={isSettling}
                  className="flex-1 py-3.5 rounded-xl bg-[#252525] border border-white/[0.06] text-white text-sm font-medium hover:bg-[#2e2e2e] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSettle}
                  disabled={isSettling}
                  className="flex-1 py-3.5 rounded-xl bg-[#22c55e] text-[#0f1010] text-sm font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-50"
                >
                  {isSettling ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
