import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-blue-600 to-blue-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold">
            Make Your City Cleaner & Smarter
          </h1>
          <p className="mt-3 text-blue-100 max-w-2xl mx-auto">
            Report civic issues, track progress, and help build a better
            community together.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/report"
              className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-50 border border-white/20"
            >
              + Report an Issue
            </Link>
            <Link
              to="/complaints"
              className="px-4 py-2 rounded-full bg-blue-400/30 text-white hover:bg-blue-400/40 border border-white/20"
            >
              👁️ View Reports
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-display text-center">
          How CleanStreet Works
        </h2>
        <p className="text-gray-600 text-center mt-1">
          Simple steps to make a difference in your community
        </p>
        <div className="mt-8 grid sm:grid-cols-3 gap-6">
          <Feature
            icon="➕"
            title="Report Issues"
            text="Easily report civic problems with photos and location details"
          />
          <Feature
            icon="👁️"
            title="Track Progress"
            text="Monitor the status of reported issues and see updates in real-time"
          />
          <Feature
            icon="🛡️"
            title="Community Impact"
            text="Vote and comment on issues to help prioritize community needs"
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="text-center rounded-xl border border-gray-200 p-6">
      <div className="text-3xl">{icon}</div>
      <div className="mt-2 font-medium">{title}</div>
      <p className="text-sm text-gray-600 mt-1">{text}</p>
    </div>
  );
}
