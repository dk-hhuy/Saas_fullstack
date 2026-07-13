"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BarChart3, BookOpen, Mic } from "lucide-react";
import { appImages } from "@/constants/images";

const cardMotion = (delay: number, rotate = 0) => ({
  initial: { opacity: 0, y: 32, rotate: rotate * 0.5 },
  animate: { opacity: 1, y: 0, rotate },
  transition: { duration: 0.65, delay, ease: "easeOut" as const },
});

const AboutHero = () => {
  return (
    <section className="about-hero" aria-labelledby="about-hero-title">
      <div className="about-hero-glow" aria-hidden />

      <div className="about-hero-content">
        <p className="about-hero-eyebrow">About TutorForge</p>
        <h1 id="about-hero-title" className="about-hero-title">
          AI Personalized
          <br />
          Voice Learning
        </h1>
        <p className="about-hero-subtitle">
          Practice any subject through live conversations with AI tutors that adapt
          to how you learn.
        </p>
      </div>

      <div className="about-hero-showcase" aria-hidden>
        <div className="about-hero-cards-row">
          <motion.div
            className="about-hero-card about-hero-card-side"
            {...cardMotion(0.15, -6)}
          >
            <div className="about-hero-card-header">
              <BarChart3 size={14} className="text-primary" />
              <span>My Journey</span>
            </div>
            <div className="about-hero-stat-grid">
              <div>
                <p className="about-hero-stat-value">42m</p>
                <p className="about-hero-stat-label">This week</p>
              </div>
              <div>
                <p className="about-hero-stat-value">5</p>
                <p className="about-hero-stat-label">Day streak</p>
              </div>
            </div>
            <div className="about-hero-progress">
              <div className="about-hero-progress-bar" style={{ width: "72%" }} />
            </div>
          </motion.div>

          <motion.div
            className="about-hero-card about-hero-card-main"
            {...cardMotion(0.05)}
          >
            <div className="about-hero-card-header">
              <Mic size={14} className="text-primary" />
              <span>Live session</span>
            </div>
            <div className="about-hero-session">
              <Image
                src={appImages.robotTutorPremium}
                alt=""
                width={120}
                height={120}
                className="about-hero-avatar"
              />
              <div className="about-hero-session-body">
                <p className="about-hero-session-title">Science Tutor</p>
                <p className="about-hero-session-topic">Photosynthesis basics</p>
                <div className="about-hero-waveform">
                  {[3, 5, 8, 4, 7, 5, 9, 4, 6, 3].map((height, index) => (
                    <span
                      key={index}
                      className="about-hero-waveform-bar"
                      style={{ height: `${height * 3}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="about-hero-card about-hero-card-side"
            {...cardMotion(0.25, 6)}
          >
            <div className="about-hero-card-header">
              <BookOpen size={14} className="text-primary" />
              <span>Library</span>
            </div>
            <ul className="about-hero-library">
              {[
                { subject: "Coding", name: "Python Basics" },
                { subject: "Maths", name: "Algebra Coach" },
                { subject: "Science", name: "Chemistry Lab" },
              ].map((item) => (
                <li key={item.name} className="about-hero-library-item">
                  <span className="about-hero-library-badge">{item.subject}</span>
                  <span className="truncate">{item.name}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
