import { Link } from 'react-router-dom'

export default function About() {
  return (
    <section className="mx-auto max-w-2xl pt-6 pb-12">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">About Tyche</h2>

      <div className="mt-8 space-y-8 text-white/80 leading-relaxed">
        <section>
          <h3 className="text-display text-xl uppercase tracking-widest text-neon-magenta mb-3">
            The App
          </h3>
          <p>
            Tyche is a randomizer for the small decisions that pile up when nobody can pick.
            What's for dinner? Which ride next? Who goes first? Pick a list, hit spin, and let
            chance answer.
          </p>
          <p className="mt-3">
            Every list has its own personality: cuisines, dishes, cocktails, Disney rides,
            workouts, party games, scenarios. Spin one at a time, or stack lists together
            with <Link to="/multi" className="text-neon-cyan hover:text-white underline">Custom Roll</Link>{' '}
            for combo decisions ("italian + cocktail + party game"). Build your own with{' '}
            <Link to="/custom" className="text-neon-cyan hover:text-white underline">New List</Link>.
          </p>
          <p className="mt-3">
            Five animation styles — slot machine, flipping coin, tumbling die, card flip,
            and a triangular RPS prism — each lets you swap the visual, not the result.
            Items can have icons and short labels for the small faces, and filters let you
            narrow a long list ("Disney rides at EPCOT, low thrill") before spinning.
          </p>
        </section>

        <section>
          <h3 className="text-display text-xl uppercase tracking-widest text-neon-acid mb-3">
            The Goddess
          </h3>
          <p>
            <strong>Tyche</strong> (<em>Τύχη</em>) was the Greek goddess of fortune, chance,
            and providence — the personification of luck in city-states and in everyday life.
            Romans called her Fortuna. She was usually depicted holding a cornucopia
            (abundance), a rudder (steering fates), and standing on a wheel that turns up
            and down without warning.
          </p>
          <p className="mt-3">
            Cities adopted her as their patron, hoping she'd tilt outcomes their way.
            In modern shorthand, she's the spirit of "let's just roll it." Picking a name
            felt right: this app is a small instrument of Tyche — a wheel that turns when
            you can't.
          </p>
        </section>

        <section>
          <h3 className="text-display text-xl uppercase tracking-widest text-neon-cobalt mb-3">
            How It Works
          </h3>
          <ul className="space-y-2 list-disc pl-6">
            <li>
              <strong className="text-white">Lists</strong>: pick from the home page or the
              sidebar's Lists section. Each list has a default animation; the picker on the
              page lets you change it.
            </li>
            <li>
              <strong className="text-white">Filters</strong>: lists like Disney rides have
              filter tags (park, thrill level). Open the Filters panel to narrow the pool.
              Default is everything available — opt in to filters by selecting chips.
            </li>
            <li>
              <strong className="text-white">Utilities</strong>: standalone Slot, Coin, Dice,
              RPS, and Cards in the sidebar — handy when you don't need a custom list.
            </li>
            <li>
              <strong className="text-white">Custom Roll</strong>: combine up to 8 lists or
              utilities into one decision. Save your favorite combos by name.
            </li>
            <li>
              <strong className="text-white">New List</strong>: build your own with optional
              per-item icons, short labels, and filter dimensions.
            </li>
            <li>
              <strong className="text-white">Settings</strong>: animation speed, sound on/off,
              reduced motion, plus full data export/import as JSON.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-display text-xl uppercase tracking-widest text-neon-yellow mb-3">
            Privacy
          </h3>
          <p>
            Everything runs in your browser. Custom lists, saved Custom Rolls, and preferences
            live in your device's local storage. Nothing is uploaded; there's no account, no
            tracking, no server-side anything. The app itself is a static site.
          </p>
        </section>

        <section>
          <h3 className="text-display text-xl uppercase tracking-widest text-neon-pink mb-3">
            Made by awryLabs
          </h3>
          <p>
            Tyche is a project from{' '}
            <a
              href="https://www.awrylabs.com"
              target="_blank"
              rel="noreferrer"
              className="text-neon-cyan hover:text-white underline"
            >
              <em>awry</em><strong>Labs</strong>
            </a>
            . Got a list idea?{' '}
            <a
              href="mailto:coffee@awrylabs.com?subject=Tyche%20List%20Suggestion"
              className="text-neon-cyan hover:text-white underline"
            >
              coffee@awrylabs.com
            </a>
            .
          </p>
        </section>
      </div>
    </section>
  )
}
