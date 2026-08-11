import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-20">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-3xl font-serif font-bold text-center mb-8">Welcome Back</h1>
        
        <form className="flex-1 flex flex-col w-full justify-center gap-4 text-foreground">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              className="rounded-lg px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              className="rounded-lg px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
          
          {searchParams?.error && (
            <p className="mt-4 p-4 bg-red-50 text-red-600 text-sm text-center rounded-lg border border-red-100">
              {searchParams.error}
            </p>
          )}
          
          <div className="flex flex-col gap-3 mt-4">
            <button
              formAction={login}
              className="bg-brand text-white rounded-full px-4 py-3 font-medium hover:bg-brand-hover transition-colors"
            >
              Sign In
            </button>
            <button
              formAction={signup}
              className="bg-white text-slate-800 border border-slate-200 rounded-full px-4 py-3 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
