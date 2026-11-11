
import Link from "next/link";
import { redirect } from "next/navigation";
import { homeFor } from "@/lib/auth/jwt";
import { getSession } from "@/lib/auth/session";

const features = [
  {
    icon: "📋",
    title: "Manage Assignments",
    description: "Create, submit, and track assignments effortlessly.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: "👥",
    title: "Role-based Access",
    description: "Dedicated portals for students and faculty.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: "📊",
    title: "Track Progress",
    description: "Monitor submissions, marks, and performance.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: "📈",
    title: "Insights & Analytics",
    description: "Get meaningful insights into academic activities.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: "🛡️",
    title: "Secure Platform",
    description: "Your academic data stays safe and protected.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: "⚡",
    title: "Seamless Experience",
    description: "A smooth and efficient user experience.",
    color: "bg-green-100 text-green-600",
  },
];

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <div className="absolute inset-8 rounded-full bg-blue-200/50 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl shadow-blue-200/50">
        <div className="flex min-h-[350px] sm:min-h-[390px]">
          {/* Sidebar */}
          <aside className="w-[115px] shrink-0 bg-[#10264c] p-3 text-white sm:w-[155px] sm:p-5">
            <div className="mb-8 text-lg font-bold sm:text-xl">
              🎓 UTMS
            </div>

            <div className="space-y-4 text-[10px] sm:text-xs">
              {[
                "⌂ Dashboard",
                "▤ Assignments",
                "↑ Submissions",
                "▥ Marks",
                "▣ Feedback",
                "◷ Analytics",
              ].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-lg px-2 py-2 ${
                    index === 0 ? "bg-blue-600" : "text-blue-100"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>

          {/* Dashboard content */}
          <div className="min-w-0 flex-1 bg-slate-50 p-3 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-xl">
                  Dashboard
                </h3>
                <p className="text-[9px] text-slate-500 sm:text-xs">
                  Welcome back! Here&apos;s your academic overview.
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                AG
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["12", "Assignments", "📋"],
                ["8", "Submitted", "✅"],
                ["3", "Pending", "🕒"],
                ["1", "Graded", "📊"],
              ].map(([number, label, icon]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm sm:p-3"
                >
                  <div className="text-sm sm:text-lg">{icon}</div>
                  <div className="mt-1 text-lg font-bold text-slate-900 sm:text-2xl">
                    {number}
                  </div>
                  <div className="text-[9px] text-slate-500 sm:text-xs">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress and deadlines */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <h4 className="mb-4 text-xs font-bold text-slate-800 sm:text-sm">
                  Assignment Progress
                </h4>

                <div className="flex items-center gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[9px] border-blue-600 text-lg font-bold text-slate-800">
                    67%
                  </div>
                  <div className="space-y-2 text-[10px] text-slate-600 sm:text-xs">
                    <p>🔵 Submitted (8)</p>
                    <p>🟣 Pending (3)</p>
                    <p>🟢 Graded (1)</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <h4 className="mb-4 text-xs font-bold text-slate-800 sm:text-sm">
                  Upcoming Deadlines
                </h4>

                {[
                  ["DBMS - Lab Report", "Nov 12"],
                  ["OS - Assignment 2", "Nov 15"],
                  ["CN - Case Study", "Nov 18"],
                ].map(([name, date]) => (
                  <div
                    key={name}
                    className="mb-3 flex items-center justify-between gap-1 text-[9px] sm:text-[10px]"
                  >
                    <span className="truncate text-slate-600">
                      🔵 {name}
                    </span>
                    <span className="shrink-0 rounded bg-red-50 px-2 py-1 text-red-600">
                      {date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const user = await getSession();

  // Preserve existing authentication behavior
  if (user) {
    redirect(homeFor(user.role));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#10264c]">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">

          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-2xl text-white">
              🎓
            </span>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                UTMS
              </h1>
              <p className="hidden text-[10px] text-slate-500 sm:block">
                University Task Management System
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <Link href="#home" className="text-blue-700">Home</Link>
            <Link href="#features" className="transition hover:text-blue-600">
              Features
            </Link>
            <Link href="#how-it-works" className="transition hover:text-blue-600">
              How It Works
            </Link>
            <Link href="#about" className="transition hover:text-blue-600">
              About
            </Link>
          </div>

          <Link
            href="/login"
            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800"
          >
            Sign In →
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/70"
      >
        <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-10 lg:py-24">

          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-bold text-blue-700">
              🎓 For Students & Faculty
            </span>

            <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-[#10264c] sm:text-5xl lg:text-6xl">
              Simplify Academic
              <span className="block bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Management.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              UTMS is a unified platform to manage assignments,
              track submissions, evaluate performance, and stay
              organized throughout the academic journey.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-blue-700 px-7 py-4 font-bold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-1 hover:bg-blue-800"
              >
                → Get Started
              </Link>

              <Link
                href="#features"
                className="rounded-xl border border-blue-700 bg-white px-7 py-4 font-bold text-blue-900 transition hover:bg-blue-50"
              >
                ▶ Learn More
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-5 text-xs font-medium text-slate-600 sm:text-sm">
              <span>✓ Easy to Use</span>
              <span>✓ Secure & Reliable</span>
            </div>
          </div>

          {/* Straight dashboard preview */}
          <DashboardPreview />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-gradient-to-b from-blue-50/70 to-white px-5 py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">

          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Key Features
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-[#10264c]">
              Everything You Need in One Place
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              UTMS provides essential tools to make academic
              management simple, efficient, and transparent.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex gap-4 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${feature.color}`}>
                  {feature.icon}
                </div>

                <div>
                  <h3 className="font-bold text-[#10264c]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-5 py-16 lg:px-10">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-extrabold text-[#10264c]">
            How UTMS Works
          </h2>

          <p className="mt-3 text-slate-500">
            Manage your academic activities in three simple steps.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ["01", "Sign In", "Access your dedicated student or faculty portal."],
              ["02", "Manage Tasks", "Create assignments, submit work, and track activities."],
              ["03", "Track Performance", "View marks, feedback, and academic progress."],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-xl font-bold text-white">
                  {number}
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT / CTA */}
      <section id="about" className="px-5 pb-12 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#10264c] to-blue-700 px-8 py-12 text-center text-white md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Ready to Get Started?
            </h2>
            <p className="mt-3 text-sm text-blue-100">
              Join UTMS and experience a smarter way to manage academics.
            </p>
          </div>

          <Link
            href="/login"
            className="shrink-0 rounded-xl bg-white px-8 py-4 font-bold text-blue-800 transition hover:bg-blue-50"
          >
            Sign In →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-blue-100 bg-slate-50 px-5 py-7 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} UTMS. All rights reserved.</p>

          <div className="flex gap-6">
            <Link href="#about" className="hover:text-blue-700">
              About
            </Link>
            <Link href="#features" className="hover:text-blue-700">
              Features
            </Link>
            <Link href="/login" className="hover:text-blue-700">
              Sign In
            </Link>
          </div>

          <p>Made with ❤️ for better academic management.</p>
        </div>
      </footer>
    </main>
  );
}
