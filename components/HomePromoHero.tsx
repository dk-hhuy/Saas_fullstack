"use client";

import Image from "next/image";
import { SignUpButton, SignedOut } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { appImages } from "@/constants/images";

type HomePromoHeroProps = {
  variant?: "guest" | "auth";
};

const HomePromoHero = ({ variant = "guest" }: HomePromoHeroProps) => {
  const hero = useTranslations("hero");
  const home = useTranslations("home");

  const isAuth = variant === "auth";
  const title = isAuth ? home("welcomeTitle") : hero("promoTitle");
  const description = isAuth ? home("welcomeDesc") : hero("promoDescription");
  const primaryLabel = isAuth ? home("welcomePrimary") : hero("getStarted");
  const secondaryLabel = isAuth ? home("welcomeSecondary") : hero("learnMore");
  const primaryHref = isAuth ? "/companions" : undefined;
  const secondaryHref = isAuth ? "/my-journey" : "/how-it-works";

  return (
    <section className="home-promo-hero" aria-labelledby="home-promo-hero-title">
      <div className="home-promo-hero-waves" aria-hidden>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="home-promo-hero-wave home-promo-hero-wave-top">
          <path
            d="M0,64 C200,20 400,100 600,56 C800,12 1000,88 1200,48 L1200,0 L0,0 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="home-promo-hero-wave home-promo-hero-wave-bottom">
          <path
            d="M0,40 C220,88 420,8 640,52 C860,96 1040,24 1200,60"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>

      <motion.div
        className="home-promo-hero-figure"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        aria-hidden
      >
        <Image
          src={appImages.homeHeroStudent}
          alt=""
          width={1024}
          height={1024}
          className="home-promo-hero-image"
          priority
        />
      </motion.div>

      <div className="home-promo-hero-grid">
        <div className="home-promo-hero-content">
          {!isAuth && <div className="home-promo-hero-badge">{hero("badge")}</div>}

          <h1 id="home-promo-hero-title" className="home-promo-hero-title">
            {title}
          </h1>

          <p className="home-promo-hero-description">{description}</p>

          <div className="flex flex-wrap gap-3">
            {isAuth ? (
              <Link href={primaryHref!} className="home-promo-hero-btn-primary">
                {primaryLabel}
                <ArrowRight size={16} aria-hidden />
              </Link>
            ) : (
              <SignedOut>
                <SignUpButton mode="modal">
                  <button type="button" className="home-promo-hero-btn-primary">
                    {primaryLabel}
                    <ArrowRight size={16} aria-hidden />
                  </button>
                </SignUpButton>
              </SignedOut>
            )}

            <Link href={secondaryHref} className="home-promo-hero-btn-secondary">
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePromoHero;
