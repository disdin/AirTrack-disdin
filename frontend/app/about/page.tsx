export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">About AirTrack</h1>
          <p className="text-xl text-muted-foreground">
            Empowering communities with real-time air quality information
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-muted-foreground leading-relaxed">
              AirTrack was created to make air quality information accessible to everyone. 
              We believe that by providing real-time, accurate data about the air we breathe, 
              we can help communities make informed decisions about their health and environment.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-muted-foreground text-sm">
                Get up-to-date air quality measurements from monitoring stations worldwide.
              </p>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Interactive Maps</h3>
              <p className="text-muted-foreground text-sm">
                Explore air quality data on interactive maps with color-coded markers.
              </p>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Historical Analytics</h3>
              <p className="text-muted-foreground text-sm">
                Track pollution trends over time with detailed charts and analytics.
              </p>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Favorites & Alerts</h3>
              <p className="text-muted-foreground text-sm">
                Save your favorite cities and get notified about air quality changes.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Data Sources</h2>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-muted-foreground mb-4">
              AirTrack aggregates data from trusted, authoritative sources:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="h-2 w-2 bg-primary rounded-full mr-3"></div>
                <span className="font-medium">OpenAQ</span> - Global air quality data platform
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 bg-primary rounded-full mr-3"></div>
                <span className="font-medium">OpenWeatherMap</span> - Weather context and forecasts
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 bg-primary rounded-full mr-3"></div>
                <span className="font-medium">US EPA</span> - Air Quality Index calculation standards
              </li>
            </ul>
          </div>
        </section>

        {/* Technology */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Built With Modern Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Frontend</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Next.js 14 with App Router</li>
                <li>• React 18 with TypeScript</li>
                <li>• Tailwind CSS for styling</li>
                <li>• Leaflet for interactive maps</li>
                <li>• Recharts for data visualization</li>
              </ul>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Backend</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Node.js with Express.js</li>
                <li>• MongoDB with Mongoose</li>
                <li>• Multi-layer caching strategy</li>
                <li>• RESTful API design</li>
                <li>• Real-time data processing</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 