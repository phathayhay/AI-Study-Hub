import { useState } from 'react'
import { Sparkles, MessageSquare, FileText, Layers, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react'
import Brand from '../../components/layout/Brand'

export function InputField({
  label,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
  required = true,
  revealable = false,
  maxLength,
  minLength,
  error = '',
  inputMode
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = revealable && showPassword ? 'text' : type

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon className="w-4.5 h-4.5" />
          </span>
        )}
        <input
          type={inputType}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          aria-invalid={error ? 'true' : 'false'}
          className={`w-full ${Icon ? 'pl-11' : 'px-4'} ${revealable ? 'pr-11' : 'px-4'} py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none transition-all duration-200 ${
            error
              ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
              : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
          }`}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-start gap-2 text-[12px] leading-5 text-rose-600 dark:text-rose-400 pl-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export function AuthLayout({ children, modeTitle, modeSubtitle, error, success, onNavigate }) {
  return (
    <main className="h-screen overflow-hidden bg-slate-50 dark:bg-[#0f172a] flex flex-col lg:flex-row font-sans transition-colors duration-300">
      <style>{`
        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-auth-fade-in {
          animation: authFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Hero Section (Left Column) */}
      <section className="auth-showcase relative hidden lg:flex w-full lg:w-[42%] bg-[#0a0f1d] flex-col justify-between p-8 lg:p-10 text-white lg:h-full overflow-y-auto border-r border-slate-800/50">
        {/* Glow Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] animate-pulse duration-[6000ms]" />
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px]" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <Brand compact={false} />
        </div>

        {/* Main Marketing / Showcase Content */}
        <div className="relative z-10 my-auto py-8 lg:py-0 flex flex-col gap-6 max-w-lg">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 tracking-wide w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Learn smarter every day
          </span>

          <h2 className="text-3xl lg:text-4xl font-jakarta font-extrabold leading-tight text-white select-none">
            Turn documents into<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-white">
              your knowledge.
            </span>
          </h2>
          
          <p className="text-slate-400 text-sm lg:text-base leading-relaxed">
            Create a personal study space powered by advanced AI. Chat with documents, auto-generate quizzes, and review using smart flashcards.
          </p>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Interactive AI Tutor</h4>
                <p className="text-xs text-slate-400 mt-0.5">Ask questions and get instant summaries from any paper or presentation.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Automatic Study Materials</h4>
                <p className="text-xs text-slate-400 mt-0.5">Generate high-quality multiple choice questions and review decks with one click.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Smart Storage Hub</h4>
                <p className="text-xs text-slate-400 mt-0.5">Keep all your slides, notes, and references organized in custom folders.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="relative z-10 border-t border-slate-800/40 pt-4 hidden lg:block">
          <p className="text-xs text-slate-500 italic">
            "Every study session can become clearer, faster, and more engaging."
          </p>
        </div>
      </section>

      {/* Form / Interactive Section (Right Column) */}
      <section className="w-full lg:w-[58%] flex flex-col justify-center overflow-y-auto h-full py-6 px-6 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto animate-auth-fade-in">
          
          {/* Header section */}
          <div className="mb-5">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{modeTitle}</h1>
            {modeSubtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{modeSubtitle}</p>}
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex gap-3 items-start animate-[shake_0.4s_ease-in-out]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex gap-3 items-start">
              <span className="shrink-0 mt-0.5">✓</span>
              <span>{success}</span>
            </div>
          )}

          {children}

          <div className="mt-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-4 py-3 text-left">
            <p className="text-[12px] leading-5 text-slate-500 dark:text-slate-400">
              We use essential cookies to keep your account signed in, protect your session, and maintain core security features. These cookies are required for the platform to work properly.
            </p>
          </div>

          {/* Back Home link */}
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center">
            <button 
              onClick={() => onNavigate?.('explore')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </button>
          </div>

        </div>
      </section>
    </main>
  )
}
