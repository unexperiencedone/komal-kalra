'use client'

import { useState } from 'react'
import { ArrowRight, Lock, CheckCircle2 } from 'lucide-react'

export default function BookAppointment() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handlePayment = async () => {
    setLoading(true)
    // Simulate secure Razorpay order creation on backend
    setTimeout(() => {
      setLoading(false)
      setStep(3)
    }, 1500)
    /* 
      // Real Implementation:
      const res = await fetch('/api/create-order', { method: 'POST', body: JSON.stringify(formData) })
      const order = await res.json()
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Komal Kalra Astrology",
        description: "Complete Life Reading",
        order_id: order.id,
        handler: async function (response) {
          // Send to backend for secure verification
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            body: JSON.stringify(response)
          })
          if(verifyRes.ok) setStep(3)
        }
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    */
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-serif font-bold text-center mb-8">Book Your Consultation</h1>
      
      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-12 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand -z-10 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-6">
            <h2 className="text-2xl font-serif font-bold mb-6">Birth Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <input required type="date" className="w-full rounded-xl border border-slate-200 p-3 focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-slate-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time of Birth</label>
                <input required type="time" className="w-full rounded-xl border border-slate-200 p-3 focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-slate-50" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Place of Birth (City, State, Country)</label>
                <input required type="text" placeholder="e.g. New Delhi, India" className="w-full rounded-xl border border-slate-200 p-3 focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-slate-50" />
              </div>
            </div>
            <button type="submit" className="w-full mt-8 bg-foreground text-white py-4 rounded-xl font-medium hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
              Continue to Payment <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold mb-2">Secure Checkout</h2>
            <p className="text-slate-500 mb-6">Complete your pre-payment to confirm the booking.</p>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
              <div className="flex justify-between items-center mb-4">
                <div className="font-medium text-lg">Complete Life Reading</div>
                <div className="font-bold text-lg">₹4,999</div>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500 border-t border-slate-200 pt-4">
                <div>Duration: 60 Mins</div>
                <div>Taxes Included</div>
              </div>
            </div>

            <button 
              onClick={handlePayment} 
              disabled={loading}
              className="w-full bg-brand text-white py-4 rounded-xl font-medium hover:bg-brand-hover transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Processing secure connection...' : 'Pay Securely with Razorpay'}
              {!loading && <Lock className="w-5 h-5" />}
            </button>
            <p className="text-xs text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Payments are securely processed and verified.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-4">Booking Confirmed!</h2>
            <p className="text-slate-600 mb-8">
              Your appointment has been successfully scheduled. You will receive an email confirmation with the meeting link shortly.
            </p>
            <button onClick={() => window.location.href = '/dashboard'} className="px-8 py-3 bg-foreground text-white rounded-full font-medium hover:bg-slate-800 transition-colors">
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
