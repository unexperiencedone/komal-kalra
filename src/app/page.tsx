import { ArrowRight, Star, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';
import MagneticButton from '@/components/ui/MagneticButton';
import FadeIn from '@/components/ui/FadeIn';
import InfiniteScroll from '@/components/ui/InfiniteScroll';

export default function Home() {
  const tickerItems = [
    "Vedic Astrology", "✦", "Vastu Shastra", "✦", 
    "Numerology", "✦", "Kundli Matching", "✦", 
    "Career Guidance", "✦", "Spiritual Healing"
  ];

  return (
    <div className="flex flex-col gap-24 pb-24 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/40 via-background to-background"></div>
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-brand text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Discover your cosmic blueprint</span>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2} direction="up">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground leading-tight mb-6 tracking-tight">
              Navigate Your Life&apos;s Journey with Cosmic Clarity
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Experience profound insights and guidance from expert Vedic Astrologer Komal Kalra. Unveil the secrets of your stars to achieve harmony, success, and peace.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <MagneticButton>
                <Link 
                  href="/book" 
                  className="w-full sm:w-auto px-8 py-4 bg-brand text-white rounded-full font-medium text-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  Book a Consultation
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link 
                  href="#about" 
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 rounded-full font-medium text-lg border border-slate-200 flex items-center justify-center"
                >
                  Meet Komal Kalra
                </Link>
              </MagneticButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Infinite Ticker */}
      <section className="py-6 bg-[#0F172A] text-white border-y border-slate-800 -rotate-1 scale-105">
        <InfiniteScroll speed={40}>
          {tickerItems.map((item, idx) => (
            <span key={idx} className={`text-xl font-serif ${item === '✦' ? 'text-brand opacity-50' : ''}`}>
              {item}
            </span>
          ))}
        </InfiniteScroll>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-1/2">
            <FadeIn direction="right">
              <div className="aspect-square md:aspect-[4/5] bg-slate-100 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-200">
                {/* Placeholder for Komal Kalra's image */}
                <div className="text-slate-400 font-medium">Portrait of Komal Kalra</div>
              </div>
            </FadeIn>
          </div>
          <div className="w-full md:w-1/2">
            <FadeIn direction="left" delay={0.2}>
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 text-foreground">Guiding Light Through Vedic Wisdom</h2>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                With over a decade of dedicated practice in Vedic Astrology, Komal Kalra brings a deep, intuitive understanding of the cosmic forces that shape our lives. Her approach is rooted in empathy, clarity, and actionable guidance.
              </p>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Whether you are facing career crossroads, relationship challenges, or seeking general life direction, Komal provides a safe space to explore your cosmic potential and align with your true purpose.
              </p>
              <div className="flex gap-12">
                <div>
                  <div className="text-4xl font-serif font-bold text-brand mb-1">10+</div>
                  <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Years Exp</div>
                </div>
                <div>
                  <div className="text-4xl font-serif font-bold text-brand mb-1">5k+</div>
                  <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Lives Touched</div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Services Bento Box Section */}
      <section id="services" className="container mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Cosmic Services</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Choose the reading that best aligns with your current life questions and spiritual needs.</p>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Main Service */}
          <div className="md:col-span-2 md:row-span-2">
            <FadeIn delay={0.1} className="h-full">
              <div className="bg-[#0F172A] text-white rounded-3xl p-8 relative overflow-hidden group h-full transition-transform hover:-translate-y-1 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl -mr-20 -mt-20 transition-all duration-700 group-hover:bg-brand/30 group-hover:scale-110"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">Most Popular</span>
                    <h3 className="text-4xl font-serif font-bold mb-4">Complete Life Reading</h3>
                    <p className="text-slate-300 mb-8 max-w-md text-lg">A comprehensive analysis of your birth chart covering career, relationships, health, and spiritual growth over the next 5 years.</p>
                    <div className="flex items-center gap-6 text-sm text-slate-300 mb-8">
                      <span className="flex items-center gap-2"><Calendar className="w-5 h-5"/> 60 Mins</span>
                      <span className="font-semibold text-white text-xl">₹4,999</span>
                    </div>
                  </div>
                  <div>
                    <MagneticButton>
                      <Link href="/book?service=complete-reading" className="inline-flex items-center gap-2 bg-brand text-white px-8 py-4 rounded-full font-medium shadow-lg shadow-brand/20">
                        Book Session <ArrowRight className="w-5 h-5" />
                      </Link>
                    </MagneticButton>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Secondary Service 1 */}
          <div className="col-span-1">
            <FadeIn delay={0.2} className="h-full">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 h-full flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100/50 hover:border-brand/30">
                <h3 className="text-2xl font-serif font-bold mb-3">Career & Wealth</h3>
                <p className="text-slate-600 text-sm mb-6 flex-1">Focus specifically on your professional trajectory, wealth accumulation, and business decisions.</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div>
                    <div className="font-bold text-foreground text-lg">₹2,999</div>
                    <div className="text-xs text-slate-500 font-medium">45 Mins</div>
                  </div>
                  <MagneticButton>
                    <Link href="/book?service=career" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-brand border border-slate-200">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Secondary Service 2 */}
          <div className="col-span-1">
            <FadeIn delay={0.3} className="h-full">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 h-full flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100/50 hover:border-brand/30">
                <h3 className="text-2xl font-serif font-bold mb-3">Relationship Match</h3>
                <p className="text-slate-600 text-sm mb-6 flex-1">Kundli matching and deep relational analysis for marriage or business partnerships.</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div>
                    <div className="font-bold text-foreground text-lg">₹3,499</div>
                    <div className="text-xs text-slate-500 font-medium">45 Mins</div>
                  </div>
                  <MagneticButton>
                    <Link href="/book?service=relationship" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-brand border border-slate-200">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Client Stories</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">Hear from those who have found clarity and direction through our consultations.</p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((i, idx) => (
              <FadeIn key={i} delay={idx * 0.15} direction="up">
                <div className="bg-[#FAFAF9] p-8 rounded-3xl border border-slate-100 h-full flex flex-col">
                  <div className="flex text-brand mb-6">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-slate-700 mb-8 italic flex-1 text-lg">&quot;The reading was incredibly accurate and provided exactly the guidance I needed during a difficult career transition. Highly recommended!&quot;</p>
                  <div>
                    <div className="font-bold text-foreground font-serif text-lg">Aarav M.</div>
                    <div className="text-sm text-slate-500 font-medium">Mumbai, India</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
