"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Mic, Sparkles, Wand2 } from "lucide-react";
import { appImages } from "@/constants/images";

const features = [
  {
    icon: Wand2,
    label: "Custom name, voice & teaching style",
  },
  {
    icon: Sparkles,
    label: "Any subject — maths, coding, language & more",
  },
  {
    icon: Mic,
    label: "Learn through natural voice conversations",
  },
];

const CTA = () => {
  return (
    <section className="cta-section" aria-labelledby="cta-heading">
      <div className="cta-section-glow cta-section-glow-left" aria-hidden />
      <div className="cta-section-glow cta-section-glow-right" aria-hidden />

      <div className="cta-section-grid">
        <div className="cta-section-content">
          <div className="cta-badge">Start learning your way</div>

          <h2 id="cta-heading" className="cta-section-title">
            Build and personalize your learning companion
          </h2>

          <p className="cta-section-description">
            Pick a name, subject, voice, and personality — then start learning
            through voice conversations that feel natural and fun.
          </p>

          <ul className="cta-feature-list">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="cta-feature-item">
                <span className="cta-feature-icon">
                  <Icon size={16} strokeWidth={2.25} />
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <Link href="/companions/new" className="cta-section-button">
            <Image src="/icons/plus.svg" alt="" width={14} height={14} />
            Build a New Companion
          </Link>
        </div>

        <motion.div
          className="cta-section-visual"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="cta-section-visual-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={appImages.edtechHowItWorks}
              alt="TutorForge learning workflow"
              width={420}
              height={420}
              className="cta-section-image rounded-3xl"
              priority
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
