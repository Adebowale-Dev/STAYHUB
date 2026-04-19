'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  BellRing,
  Building2,
  CheckCircle2,
  CreditCard,
  DoorOpen,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';

type LandingItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const featureCards: LandingItem[] = [
  {
    title: 'Room inventory that stays organized',
    description:
      'Track hostels, rooms, and occupancy from one clean control center built for busy accommodation teams.',
    icon: BedDouble,
  },
  {
    title: 'Payments with fewer blind spots',
    description:
      'Keep payment flows visible so students, admins, and finance teams can move with more confidence.',
    icon: CreditCard,
  },
  {
    title: 'Faster student communication',
    description:
      'Send updates, surface alerts, and reduce the back-and-forth that slows down move-ins and support.',
    icon: BellRing,
  },
  {
    title: 'Access for every operational role',
    description:
      'Give admins, students, and porters dedicated workflows without forcing everyone into the same screen.',
    icon: ShieldCheck,
  },
];

const roleCards: LandingItem[] = [
  {
    title: 'Admin teams',
    description:
      'Oversee colleges, departments, students, rooms, and reports from a single operational dashboard.',
    icon: Building2,
  },
  {
    title: 'Students',
    description:
      'Browse hostels, reserve spaces, confirm payments, and follow updates without guessing what comes next.',
    icon: Sparkles,
  },
  {
    title: 'Porters',
    description:
      'Handle check-ins, room visibility, and on-ground student support with a lighter daily workflow.',
    icon: DoorOpen,
  },
];

const launchSteps = [
  'Set up colleges, departments, hostels, and rooms.',
  'Let students reserve spaces and complete payment steps.',
  'Keep porter operations and notifications in sync during move-in.',
];

const headlineFont =
  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

export default function Home() {
  const { isAuthenticated, getRedirectPath } = useAuthStore();
  const primaryHref = isAuthenticated ? getRedirectPath() : '/login';
  const primaryLabel = isAuthenticated ? 'Open Dashboard' : 'Enter Portal';

  return (
    <main className="force-light landing-surface relative min-h-screen overflow-hidden text-slate-950">
      <div className="landing-grid pointer-events-none absolute inset-x-0 top-0 h-[44rem]" />
      <div className="landing-orb landing-orb-teal" aria-hidden="true" />
      <div className="landing-orb landing-orb-amber" aria-hidden="true" />

      <div className="relative z-10">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-slate-700 uppercase"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-900/10 bg-white/80 shadow-[0_20px_40px_rgba(15,23,42,0.08)] backdrop-blur">
              <Building2 className="h-5 w-5 text-slate-900" />
            </span>
            StayHub
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-950">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-slate-950">
              Workflow
            </a>
            <a href="#roles" className="transition hover:text-slate-950">
              Roles
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900/20 hover:text-slate-950 sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-7xl gap-16 px-6 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:pb-28 lg:pt-16">
          <div className="landing-rise max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase shadow-[0_20px_40px_rgba(15,23,42,0.05)]">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Student accommodation, reworked for clarity
            </div>

            <h1
              className="mt-8 text-5xl leading-none tracking-tight text-slate-950 sm:text-6xl lg:text-7xl"
              style={{ fontFamily: headlineFont }}
            >
              A calmer way to run hostels, rooms, payments, and move-ins.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              StayHub gives campus housing teams one place to coordinate student
              reservations, payment status, porter operations, and room
              visibility without the usual spreadsheet chaos.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f766e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#115e59]"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/75 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-900/20 hover:bg-white"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="landing-panel rounded-[1.75rem] p-5">
                <p className="text-sm font-medium text-slate-500">
                  Operational lens
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  3 roles
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Separate views for admins, students, and porters.
                </p>
              </div>
              <div className="landing-panel rounded-[1.75rem] p-5">
                <p className="text-sm font-medium text-slate-500">
                  Visibility
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  1 hub
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Hostel, student, and payment data pulled into one flow.
                </p>
              </div>
              <div className="landing-panel rounded-[1.75rem] p-5">
                <p className="text-sm font-medium text-slate-500">Outcome</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  Less friction
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Fewer handoffs during booking, payment, and check-in.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="landing-panel landing-float rounded-[2rem] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Control center
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    StayHub overview
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live workflow
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-950 px-4 py-5 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                    Occupancy
                  </p>
                  <p className="mt-4 text-3xl font-semibold">96%</p>
                  <p className="mt-2 text-sm text-white/70">
                    Active bed spaces tracked by room.
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Payment status
                  </p>
                  <p className="mt-4 text-3xl font-semibold text-slate-950">
                    88%
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Settled faster with clearer confirmation steps.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f59e0b] px-4 py-5 text-slate-950">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-800/70">
                    Porter queue
                  </p>
                  <p className="mt-4 text-3xl font-semibold">14</p>
                  <p className="mt-2 text-sm text-slate-800/80">
                    Pending move-ins visible in one place.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.6rem] bg-white px-5 py-5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-950">
                      Today&apos;s checkpoints
                    </p>
                    <span className="text-xs text-slate-500">
                      Updated now
                    </span>
                  </div>
                  <div className="mt-5 space-y-4">
                    {[
                      'Approve room allocations for final-year students',
                      'Verify reservation payments still pending confirmation',
                      'Prepare porter team for afternoon hostel arrivals',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#0f766e]" />
                        <p className="text-sm leading-6 text-slate-600">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[1.6rem] bg-slate-950 px-5 py-5 text-white">
                    <p className="text-sm font-semibold">Student experience</p>
                    <p className="mt-3 text-sm leading-6 text-white/70">
                      Reservation progress, payment visibility, and room details
                      stay easy to follow.
                    </p>
                  </div>
                  <div className="rounded-[1.6rem] bg-[#ecfeff] px-5 py-5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-950">
                      Admin pulse
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Colleges, departments, students, and reports stay close to
                      the same operating view.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-panel absolute -bottom-6 -left-2 hidden max-w-xs rounded-[1.75rem] p-5 lg:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f766e]/10">
                  <Users className="h-5 w-5 text-[#0f766e]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Role-ready screens
                  </p>
                  <p className="text-sm text-slate-500">
                    Clear handoff between office and on-ground teams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
              Features
            </p>
            <h2
              className="mt-4 text-4xl leading-tight text-slate-950 sm:text-5xl"
              style={{ fontFamily: headlineFont }}
            >
              A landing page that finally feels like the product behind it.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The homepage now introduces the platform instead of immediately
              throwing people into a redirect. It explains what StayHub does and
              where each user group fits.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((item) => (
              <article
                key={item.title}
                className="landing-panel rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10"
        >
          <div className="grid gap-10 rounded-[2rem] bg-slate-950 px-6 py-10 text-white lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-14">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-white/60 uppercase">
                Workflow
              </p>
              <h2
                className="mt-4 text-4xl leading-tight sm:text-5xl"
                style={{ fontFamily: headlineFont }}
              >
                One flow from allocation to move-in.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
                StayHub works best when the front office and on-ground teams are
                looking at the same operational story. That is the experience
                this new landing page now sets up from the first visit.
              </p>
            </div>

            <div className="grid gap-4">
              {launchSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-5 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-amber-300">
                    Step {index + 1}
                  </p>
                  <p className="mt-3 text-lg leading-7 text-white/85">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="roles"
          className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Roles
              </p>
              <h2
                className="mt-4 text-4xl leading-tight text-slate-950 sm:text-5xl"
                style={{ fontFamily: headlineFont }}
              >
                Built for every side of campus housing operations.
              </h2>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
            >
              Access the portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {roleCards.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-[1.9rem] p-6 ${
                  index === 1
                    ? 'bg-[#0f766e] text-white shadow-[0_30px_80px_rgba(15,118,110,0.22)]'
                    : 'landing-panel text-slate-950'
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    index === 1
                      ? 'bg-white/14 text-white'
                      : 'bg-slate-950 text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-8 text-2xl font-semibold">{item.title}</h3>
                <p
                  className={`mt-4 text-sm leading-7 ${
                    index === 1 ? 'text-white/80' : 'text-slate-600'
                  }`}
                >
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-10 lg:px-10">
          <div className="rounded-[2.25rem] border border-slate-900/10 bg-white/80 px-6 py-10 shadow-[0_35px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:px-10 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
                  Ready to use
                </p>
                <h2
                  className="mt-4 text-4xl leading-tight text-slate-950 sm:text-5xl"
                  style={{ fontFamily: headlineFont }}
                >
                  Open the platform and pick up where your team left off.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  The landing page now gives StayHub a clearer first impression,
                  while the existing login and dashboard routes remain ready for
                  day-to-day use.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-900/10 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-900/20 hover:bg-slate-50"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
