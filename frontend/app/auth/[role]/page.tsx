"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Field, TextInput, PasswordInput, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { industries, orgSizes, specializations, isRoleSlug } from "@/lib/roles";
import { useAuth } from "@/lib/auth";

type Mode = "signin" | "register";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage({
  params,
}: {
  params: { role: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = isRoleSlug(params.role) ? params.role : "freelancer";
  const initialMode = searchParams.get("mode") === "signin" ? "signin" : "register";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState(industries[0]);
  const [website, setWebsite] = useState("");
  const [orgSize, setOrgSize] = useState(orgSizes[1]);
  const [about, setAbout] = useState("");
  const [specialization, setSpecialization] = useState(specializations[0]);
  const [portfolio, setPortfolio] = useState("");
  const [bio, setBio] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  const isBrand = role === "brand";

  useEffect(() => {
    if (!isRoleSlug(params.role)) router.replace("/role");
  }, [params.role, router]);

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    const cleanEmail = email.trim();

    if (mode === "register") {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setError("Please enter your full name (minimum 2 characters).");
        return;
      }
      if (!cleanEmail) {
        setError("Please enter your email address.");
        return;
      }
      if (!EMAIL_REGEX.test(cleanEmail)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!password || password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!consentChecked) {
        setError("Please accept the terms and privacy policy.");
        return;
      }

      setIsSubmitting(true);
      try {
        const user = await auth.register({
          fullName: fullName.trim(),
          email: cleanEmail,
          password,
          role,
          ...(isBrand && {
            orgName: orgName.trim(),
            brandName: brandName.trim(),
            industry,
            website: website.trim(),
            size: orgSize,
            about: about.trim(),
          }),
          ...(!isBrand && {
            specialization,
            portfolio: portfolio.trim(),
            bio: bio.trim(),
          }),
        });
        router.push(user.role === "brand" ? "/brand" : "/freelancer");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Registration failed.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!cleanEmail) {
        setError("Please enter your email address.");
        return;
      }
      if (!password) {
        setError("Please enter your password.");
        return;
      }

      setIsSubmitting(true);
      try {
        const user = await auth.login(cleanEmail, password, role);
        router.push(user.role === "brand" ? "/brand" : "/freelancer");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Sign in failed.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  if (!isRoleSlug(params.role)) return null;

  return (
    <main className="page-shell bg-canvas bg-auth-pattern px-4">
      <Header />

      <div className="mt-4 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.6px] text-ink">
            {mode === "register" ? "Create your account" : "Sign In"}
          </h1>
          <p className="text-sm leading-[22px] text-muted">
            {mode === "register" ? (
              <>Create a secure Inkloom AI {role} account.</>
            ) : (
              <>Sign in to your {role} workspace.</>
            )}
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-[#f4c7c3] bg-[#fef3f2] p-3 text-sm text-[#b42318]">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="card flex flex-col gap-4 p-5 sm:p-6" noValidate>
          {mode === "register" && (
            <>
              <Field label="Full Name" htmlFor="full-name" icon="user">
                <TextInput
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </Field>

              <Field label="Email Address" htmlFor="email" icon="mail">
                <TextInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field label="Password (min 8 chars)" htmlFor="password" icon="lock">
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Field label="Confirm Password" htmlFor="confirm-password" icon="lock">
                <PasswordInput
                  id="confirm-password"
                  name="confirm-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Field>

              {isBrand ? (
                <>
                  <Field label="Organization Name" htmlFor="org-name">
                    <TextInput id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                  </Field>
                  <Field label="Brand Name" htmlFor="brand-name">
                    <TextInput id="brand-name" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                  </Field>
                  <Field label="Industry" htmlFor="industry">
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value as any)}
                      className="field-input"
                    >
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Website" htmlFor="website">
                    <TextInput id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
                  </Field>
                  <Field label="Company Size" htmlFor="org-size">
                    <select
                      id="org-size"
                      value={orgSize}
                      onChange={(e) => setOrgSize(e.target.value as any)}
                      className="field-input"
                    >
                      {orgSizes.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="About" htmlFor="about">
                    <textarea
                      id="about"
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="field-input h-auto py-2"
                      rows={3}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Specialization" htmlFor="specialization">
                    <select
                      id="specialization"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value as any)}
                      className="field-input"
                    >
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Portfolio URL" htmlFor="portfolio">
                    <TextInput id="portfolio" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://behance.net/yourname" />
                  </Field>
                  <Field label="Bio" htmlFor="bio">
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="field-input h-auto py-2"
                      rows={3}
                    />
                  </Field>
                </>
              )}

              <Field label="" htmlFor="consent">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  required
                >
                  I agree to the Terms of Service and Privacy Policy
                </Checkbox>
              </Field>
            </>
          )}

          {mode === "signin" && (
            <>
              <Field label="Email Address" htmlFor="login-email" icon="mail">
                <TextInput
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field label="Password" htmlFor="login-password" icon="lock">
                <PasswordInput
                  id="login-password"
                  name="login-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
            </>
          )}

          <Button type="submit" loading={isSubmitting}>
            {mode === "register" ? "Create Account" : "Sign In"}
          </Button>

          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            {mode === "register" ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeChange("signin")}
                  className="font-semibold text-accent hover:underline"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeChange("register")}
                  className="font-semibold text-accent hover:underline"
                >
                  Register
                </button>
              </span>
            )}
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted">
          <span className="w-full border-t border-[#ebe4f7]" />
          <span>Email verification is not configured; registered accounts are immediately available.</span>
          <span className="w-full border-t border-[#ebe4f7]" />
        </div>
      </div>

      <Footer />
    </main>
  );
}