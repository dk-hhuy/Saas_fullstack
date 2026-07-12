import { appImages } from "@/constants/images";
import Image from "next/image";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import NavItems from "./NavItems";
import ThemeToggle from "./ThemeToggle";
import LocaleSwitcher from "./LocaleSwitcher";
import NavbarUserButton from "./NavbarUserButton";

const Navbar = async () => {
  const t = await getTranslations("common");

  return (
    <header className="navbar">
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src={appImages.logo}
          alt={t("brand")}
          width={48}
          height={48}
          className="rounded-xl object-cover"
          priority
        />
        <span className="hidden font-bold tracking-tight sm:inline">{t("brand")}</span>
      </Link>

      <div className="flex items-center gap-3 md:gap-5">
        <NavItems />
        <LocaleSwitcher className="max-lg:hidden" />
        <ThemeToggle />

        <SignedOut>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <button className="btn-signin">{t("signIn")}</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-primary text-sm max-sm:hidden">{t("signUp")}</button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <Link href="/companions/new" className="btn-primary text-sm max-sm:hidden">
            {t("buildCompanion")}
          </Link>
          <NavbarUserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Navbar;
