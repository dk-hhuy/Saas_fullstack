"use client";

import Image from "next/image";
import { SignUpButton, SignedOut } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { appImages } from "@/constants/images";

const LandingHero = () => {
  const t = useTranslations("hero");

  const highlights = [t("highlight1"), t("highlight2"), t("highlight3")];

  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="cta-section-glow cta-section-glow-left" aria-hidden />
      <div className="cta-section-glow cta-section-glow-right" aria-hidden />

      <div className="landing-hero-grid">
        <div className="landing-hero-content">
          <div className="cta-badge">{t("badge")}</div>

          <h1 id="landing-hero-title" className="landing-hero-title">
            {t("title")}
          </h1>

          <p className="landing-hero-description">{t("description")}</p>

          <ul className="cta-feature-list">
            {highlights.map((label) => (
              <li key={label} className="cta-feature-item">
                <span className="cta-feature-icon">
                  <Sparkles size={16} strokeWidth={2.25} />
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 pt-1">
            <SignedOut>
              <SignUpButton mode="modal">
                <button type="button" className="cta-section-button">
                  {t("getStarted")}
                  <ArrowRight size={16} />
                </button>
              </SignUpButton>
            </SignedOut>
            <Link
              href="/companions"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Mic size={16} />
              {t("browseCompanions")}
            </Link>
          </div>
        </div>

        <motion.div
          className="landing-hero-visual"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="landing-hero-image-frame">
            <Image
              src={appImages.robotTutorPremium}
              alt="TutorForge AI robot tutor"
              width={640}
              height={640}
              className="h-full w-full object-cover object-top"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingHero;
