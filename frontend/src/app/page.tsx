import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className="animate-fade-in">
      <div className="container">
        <nav className={styles.navbar}>
          <div className={styles.logo}>TalentIQ</div>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="#features" className={styles.navLink}>Features</Link>
            <Link href="#workflow" className={styles.navLink}>Workflow</Link>
            <Link href="#testimonials" className={styles.navLink}>Testimonials</Link>
          </div>
          <div className={styles.authButtons}>
            <Link href="/login" className="btn btn-outline">Login</Link>
            <Link href="/signup" className="btn btn-primary">Sign Up</Link>
          </div>
        </nav>
      </div>

      <main className={styles.heroContainer}>
        <div className={styles.videoContainer}>
          <video
            autoPlay
            muted
            loop
            playsInline
            src="https://framerusercontent.com/assets/1g8IkhtJmlWcC4zEYWKUmeGWzI.mp4"
            className={styles.videoBackground}
          />
          <div className={styles.videoOverlay} />
        </div>

        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.pulseDot} />
              NEXT GEN AI INTERVIEW PLATFORM
            </div>

            <h1 className={styles.title}>
              Hire Smarter. <br />
              Interview Faster. <span className="highlight-text">With AI.</span>
            </h1>

            <p className={styles.subtitle}>
              An AI-powered interview intelligence platform that evaluates candidates using Resume Analysis, Voice Intelligence, Behavioral Assessment, Technical Evaluation, and a RAG Knowledge Engine.
            </p>

            <div className={styles.buttonGroup}>
              <Link href="/login" className="btn btn-primary">
                Start Interview
              </Link>
              <a href="#demo" className="btn btn-outline">
                Watch Demo
              </a>
            </div>

            <div className={styles.previewCard}>
              <div className={styles.previewMetric}>
                <div className={styles.previewLabel}>Candidate Score</div>
                <div className={styles.previewValue}>92%</div>
              </div>
              <div className={styles.previewMetric}>
                <div className={styles.previewLabel}>Resume Match</div>
                <div className={styles.previewValue}>89%</div>
              </div>
              <div className={styles.previewMetric}>
                <div className={styles.previewLabel}>Confidence Score</div>
                <div className={styles.previewValue}>95%</div>
              </div>
              <div className={styles.previewMetric}>
                <div className={styles.previewLabel}>Hiring Recommendation</div>
                <div className={`${styles.previewValue} ${styles.previewStatus}`}>Strong Hire</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className="container">
          <div className={styles.badge}>WE ANALYZE TALENT</div>
          <h2 className={styles.sectionHeading}>
            We find what to <span className="highlight-text">evaluate</span>, who your candidates are, and how AI can optimize hiring decisions.
          </h2>

          <div className={styles.featureGrid}>
            {/* 1. Resume Intelligence */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📄</div>
              <h3 className={styles.featureTitle}>Resume Intelligence</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Resume Parsing</li>
                <li className={styles.featureItem}>ATS Analysis</li>
                <li className={styles.featureItem}>Skill Extraction</li>
              </ul>
            </div>

            {/* 2. AI Interview Engine */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <h3 className={styles.featureTitle}>AI Interview Engine</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Dynamic Questions</li>
                <li className={styles.featureItem}>Follow-up Questions</li>
                <li className={styles.featureItem}>Adaptive Flow</li>
              </ul>
            </div>

            {/* 3. Voice Intelligence */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎙️</div>
              <h3 className={styles.featureTitle}>Voice Intelligence</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Speech-to-Text</li>
                <li className={styles.featureItem}>Filler Word Detection</li>
                <li className={styles.featureItem}>Silence Analysis</li>
              </ul>
            </div>

            {/* 4. Behavioral Analysis */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🧠</div>
              <h3 className={styles.featureTitle}>Behavioral Analysis</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Leadership Indicators</li>
                <li className={styles.featureItem}>Communication Score</li>
                <li className={styles.featureItem}>Collaboration Traits</li>
              </ul>
            </div>

            {/* 5. JD Matching */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎯</div>
              <h3 className={styles.featureTitle}>JD Matching</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Resume vs JD</li>
                <li className={styles.featureItem}>Skill Gap Analysis</li>
                <li className={styles.featureItem}>Fit Score</li>
              </ul>
            </div>

            {/* 6. Candidate Ranking */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3 className={styles.featureTitle}>Candidate Ranking</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Auto Ranking</li>
                <li className={styles.featureItem}>Department Wise</li>
                <li className={styles.featureItem}>Hiring Pipeline</li>
              </ul>
            </div>

            {/* 7. RAG Interview Engine */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📁</div>
              <h3 className={styles.featureTitle}>RAG Interview Engine</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Company Documents</li>
                <li className={styles.featureItem}>Internal Knowledge</li>
                <li className={styles.featureItem}>Dynamic Questions</li>
              </ul>
            </div>

            {/* 8. Analytics */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📈</div>
              <h3 className={styles.featureTitle}>Analytics</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Interview Trends</li>
                <li className={styles.featureItem}>Team Performance</li>
                <li className={styles.featureItem}>Recruitment Insights</li>
              </ul>
            </div>

            {/* 9. Security */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3 className={styles.featureTitle}>Security</h3>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Role-Based Access</li>
                <li className={styles.featureItem}>Encryption</li>
                <li className={styles.featureItem}>Audit Logs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Workflow Timeline */}
      <section id="workflow" className={styles.workflowSection}>
        <div className="container">
          <div className={styles.badge}>PLATFORM WORKFLOW</div>
          <h2 className={styles.sectionHeading}>
            Our end-to-end recruitment process powered by <span className="highlight-text">Intelligence</span>.
          </h2>

          <div className={styles.workflowTimeline}>
            <div className={styles.workflowStep}>
              <div className={styles.workflowDot}>1</div>
              <div className={styles.workflowLabel}>Upload Resume</div>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.workflowDot}>2</div>
              <div className={styles.workflowLabel}>Generate AI Interview</div>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.workflowDot}>3</div>
              <div className={styles.workflowLabel}>Conduct Interview</div>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.workflowDot}>4</div>
              <div className={styles.workflowLabel}>Analyze Voice & Behavior</div>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.workflowDot}>5</div>
              <div className={styles.workflowLabel}>Generate Report</div>
            </div>
            <div className={styles.workflowStep}>
              <div className={styles.workflowDot}>6</div>
              <div className={styles.workflowLabel}>Hiring Decision</div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Client Logos Marquee */}
      <section className={styles.marqueeContainer}>
        <div className={styles.marqueeTrack}>
          <span className={styles.logoItem}>Google</span>
          <span className={styles.logoItem}>Microsoft</span>
          <span className={styles.logoItem}>Meta</span>
          <span className={styles.logoItem}>Amazon</span>
          <span className={styles.logoItem}>Netflix</span>
          <span className={styles.logoItem}>Apple</span>
          <span className={styles.logoItem}>Uber</span>
          <span className={styles.logoItem}>Airbnb</span>
          <span className={styles.logoItem}>Stripe</span>
          {/* Duplicate for infinite loop */}
          <span className={styles.logoItem}>Google</span>
          <span className={styles.logoItem}>Microsoft</span>
          <span className={styles.logoItem}>Meta</span>
          <span className={styles.logoItem}>Amazon</span>
          <span className={styles.logoItem}>Netflix</span>
          <span className={styles.logoItem}>Apple</span>
          <span className={styles.logoItem}>Uber</span>
          <span className={styles.logoItem}>Airbnb</span>
          <span className={styles.logoItem}>Stripe</span>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className={styles.testimonialsSection}>
        <div className="container">
          <div className={styles.badge}>TRUSTED BY LEADERS</div>
          <h2 className={styles.sectionHeading}>
            What engineering and HR leaders say about the <span className="highlight-text">Future</span> of hiring.
          </h2>

          <div className={styles.testimonialGrid}>
            <div className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>
                &ldquo;TalentIQ transformed our recruiting process. The voice intelligence insights are incredibly accurate.&rdquo;
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>SK</div>
                <div>
                  <div className={styles.authorName}>Sarah K.</div>
                  <div className={styles.authorTitle}>VP of Talent</div>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>
                &ldquo;The RAG interview engine created custom questions that perfectly tested our internal tech stack.&rdquo;
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>DL</div>
                <div>
                  <div className={styles.authorName}>David L.</div>
                  <div className={styles.authorTitle}>Engineering Manager</div>
                </div>
              </div>
            </div>

            <div className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>
                &ldquo;We went from candidate application to interview report in less than 24 hours. A game-changer.&rdquo;
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>ER</div>
                <div>
                  <div className={styles.authorName}>Elena R.</div>
                  <div className={styles.authorTitle}>Head of People</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
