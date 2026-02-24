export default function SetupRequiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Setup Required</h1>
        <p className="mb-4 text-sm text-gray-600">
          Supabase is not configured. Add the following to your <code className="rounded bg-gray-100 px-1">.env</code> file:
        </p>
        <pre className="mb-4 overflow-x-auto rounded bg-gray-900 p-4 text-sm text-gray-100">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p className="text-sm text-gray-600">
          Create a project at <a href="https://supabase.com" className="text-slate-600 underline hover:text-slate-800">supabase.com</a>, run the schema in <code className="rounded bg-gray-100 px-1">supabase/schema.sql</code>, enable Google sign-in in Authentication → Providers, then restart the dev server.
        </p>
      </div>
    </div>
  )
}
