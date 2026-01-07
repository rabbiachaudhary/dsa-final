import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Shield, BarChart3, Users, Smartphone, RefreshCw, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import "../HomePagePremium.css";

const HomePage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition-all group-hover:scale-105 group-hover:shadow-blue-500/50">
                D
              </div>
              <span className="text-xl font-bold text-gray-900">DeskMate</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                How it works
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/signin" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Sign in
              </Link>
              <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-gradient"></div>
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>
        <div className="hero-blob hero-blob-3"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="hero-badge">
              <Sparkles className="h-4 w-4" />
              <span>DSA Powered Seating Intelligence</span>
            </div>

            <h1 className="hero-title">
              Exam seating made <span className="gradient-text">intelligent</span>
            </h1>

            <p className="hero-subtitle">
              Generate perfect seating arrangements in seconds. Prevent cheating, optimize space, and eliminate conflicts with advanced algorithms.
            </p>

            <div className="hero-cta-group">
              <Link to="/signup" className="btn-premium btn-premium-primary">
                <span>Start free trial</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#how-it-works" className="btn-premium btn-premium-secondary">
                <span>See how it works</span>
              </a>
            </div>

            <p className="hero-social-proof">
              No credit card required • Free 30-day trial • Cancel anytime
            </p>

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Conflict-free</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">&lt;2s</div>
                <div className="stat-label">Generation time</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">10k+</div>
                <div className="stat-label">Students seated</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-header">
            <h2 className="section-title">
              Everything you need to <span className="gradient-text">succeed</span>
            </h2>
            <p className="section-subtitle">
              Powerful features designed for efficiency and scale
            </p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Generate seating plans for thousands of students in milliseconds with optimized algorithms.",
                iconClass: "icon-gradient-1",
              },
              {
                icon: Shield,
                title: "Cheat Prevention",
                description: "Smart mixing algorithms prevent same-section students from sitting adjacent to each other.",
                iconClass: "icon-gradient-2",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description: "Track utilization, efficiency metrics, and export professional PDF reports instantly.",
                iconClass: "icon-gradient-3",
              },
              {
                icon: Users,
                title: "Bulk Management",
                description: "Handle hundreds of sessions, multiple exam halls, and complex constraints effortlessly.",
                iconClass: "icon-gradient-4",
              },
              {
                icon: Smartphone,
                title: "Mobile Ready",
                description: "Access and manage your exam plans from any device with our responsive interface.",
                iconClass: "icon-gradient-5",
              },
              {
                icon: RefreshCw,
                title: "Easy Adjustments",
                description: "Quickly regenerate plans with different parameters and iterate until perfect.",
                iconClass: "icon-gradient-6",
              },
            ].map((feature, index) => (
              <div key={index} className="feature-card">
                <div className={`feature-icon-wrapper ${feature.iconClass}`}>
                  <feature.icon />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-header">
            <h2 className="section-title">
              Simple, <span className="gradient-text">powerful</span> workflow
            </h2>
            <p className="section-subtitle">
              From data to deployment in three easy steps
            </p>
          </div>

          <div className="steps-container">
            {[
              {
                number: "1",
                title: "Upload & Configure",
                description: "Import your student data, define exam sessions, rooms, and time slots. Set your constraints and preferences.",
                emoji: "📤",
              },
              {
                number: "2",
                title: "DSA Powered Generation",
                description: "Our advanced data structures and algorithms optimize seat assignments, prevent conflicts, and maximize space utilization instantly.",
                emoji: "⚡",
              },
              {
                number: "3",
                title: "Review & Export",
                description: "Verify results with visual previews, make any adjustments, and export print-ready PDFs for distribution.",
                emoji: "✓",
              },
            ].map((item, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{item.number}</div>
                <span className="step-emoji">{item.emoji}</span>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-description">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-wrapper">
          <div className="cta-pattern"></div>
          
          <div className="cta-content">
            <h2 className="cta-title">
              Ready to transform your exam planning?
            </h2>
            <p className="cta-subtitle">
              Join thousands of institutions using DeskMate to streamline their exam seating process.
            </p>
            
            <div className="cta-buttons">
              <Link to="/signup" className="btn-cta-white">
                <span>Start your free trial</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#features" className="btn-cta-outline">
                <span>Learn more</span>
              </a>
            </div>
            
            <div className="cta-benefits">
              <div className="cta-benefit-item">
                <CheckCircle2 className="h-5 w-5" />
                <span>No credit card</span>
              </div>
              <div className="cta-benefit-item">
                <CheckCircle2 className="h-5 w-5" />
                <span>30-day trial</span>
              </div>
              <div className="cta-benefit-item">
                <CheckCircle2 className="h-5 w-5" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="premium-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">D</div>
              <span>DeskMate</span>
            </div>
            <p className="footer-tagline">
              Intelligent exam seating platform to streamline your planning process.
            </p>
          </div>

          <div className="footer-column">
            <h4>Product</h4>
            <div className="footer-links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <Link to="/">Pricing</Link>
            </div>
          </div>

          <div className="footer-column">
            <h4>Company</h4>
            <div className="footer-links">
              <Link to="/">About</Link>
              <Link to="/">Blog</Link>
              <Link to="/">Contact</Link>
            </div>
          </div>

          <div className="footer-column">
            <h4>Legal</h4>
            <div className="footer-links">
              <Link to="/">Privacy</Link>
              <Link to="/">Terms</Link>
              <Link to="/">Security</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          © 2025 DeskMate. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
