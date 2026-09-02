import {
  signInMasterAdmin,
} from "@/lib/admin/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params =
    await searchParams;

  const errorMessage =
    params.error === "missing"
      ? "Enter your email and password."
      : params.error === "invalid"
      ? "Invalid email or password."
      : null;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
              LYNUX
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Admin Core
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in with an authorized master administrator account.
            </p>
          </div>

          {errorMessage ? (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <form
            action={signInMasterAdmin}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}