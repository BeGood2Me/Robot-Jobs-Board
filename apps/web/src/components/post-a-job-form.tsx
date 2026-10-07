'use client';

import { useState, useTransition } from 'react';
import { FEATURED_COUNTRIES, type FeaturedListingErrors } from '@/lib/featured-listing';

type FormState = {
  title: string;
  companyName: string;
  applyUrl: string;
  description: string;
  city: string;
  /** Preset from the select, or "Other". */
  country: string;
  /** Free-text country when country === "Other". */
  countryOther: string;
  isRemote: boolean;
  employmentType: string;
  compensationText: string;
  buyerEmail: string;
};

const INITIAL: FormState = {
  title: '',
  companyName: '',
  applyUrl: '',
  description: '',
  city: '',
  country: 'United States',
  countryOther: '',
  isRemote: false,
  employmentType: 'FULL_TIME',
  compensationText: '',
  buyerEmail: '',
};

function resolvedCountry(form: FormState): string {
  if (form.country === 'Other') return form.countryOther.trim();
  return form.country.trim();
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-400">{message}</p>;
}

export function PostAJobForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FeaturedListingErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as keyof FeaturedListingErrors]) return prev;
      const next = { ...prev };
      delete next[key as keyof FeaturedListingErrors];
      return next;
    });
  }

  const countryValue = resolvedCountry(form);
  const previewLocation = form.isRemote
    ? countryValue
      ? `Remote · ${countryValue}`
      : 'Remote'
    : [form.city, countryValue].filter(Boolean).join(', ') || 'Location';

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      try {
        const { countryOther: _omit, ...rest } = form;
        const res = await fetch('/api/checkout/featured', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rest, country: resolvedCountry(form) }),
        });
        const data = (await res.json()) as {
          url?: string;
          error?: string;
          errors?: FeaturedListingErrors;
        };
        if (!res.ok) {
          if (data.errors) setErrors(data.errors);
          setFormError(data.error ?? 'Could not start checkout.');
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setFormError('Checkout did not return a payment URL.');
      } catch {
        setFormError('Network error. Try again.');
      }
    });
  }

  const labelClass = 'block text-sm font-semibold text-foreground';
  const helpClass = 'mt-1 text-xs text-muted';
  const inputClass =
    'mt-2 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent';

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <div>
          <label htmlFor="title" className={labelClass}>
            Job title
          </label>
          <p className={helpClass}>Example: Robotics Software Engineer</p>
          <input
            id="title"
            name="title"
            autoComplete="off"
            className={inputClass}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Robotics Software Engineer"
            maxLength={120}
            required
          />
          <FieldError message={errors.title} />
        </div>

        <div>
          <label htmlFor="companyName" className={labelClass}>
            Company name
          </label>
          <p className={helpClass}>The employer name shown on the board — not a website.</p>
          <input
            id="companyName"
            name="companyName"
            autoComplete="organization"
            className={inputClass}
            value={form.companyName}
            onChange={(e) => update('companyName', e.target.value)}
            placeholder="Acme Robotics"
            maxLength={100}
            required
          />
          <FieldError message={errors.companyName} />
        </div>

        <div>
          <label htmlFor="applyUrl" className={labelClass}>
            Apply link
          </label>
          <p className={helpClass}>
            Link where candidates apply (Greenhouse, Lever, Ashby, or your careers page). Must start
            with https://
          </p>
          <input
            id="applyUrl"
            name="applyUrl"
            type="url"
            inputMode="url"
            autoComplete="off"
            className={inputClass}
            value={form.applyUrl}
            onChange={(e) => update('applyUrl', e.target.value)}
            placeholder="https://boards.greenhouse.io/acme/jobs/123"
            required
          />
          <FieldError message={errors.applyUrl} />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Job description
          </label>
          <p className={helpClass}>Paste the role overview, responsibilities, and requirements.</p>
          <textarea
            id="description"
            name="description"
            rows={12}
            className={`${inputClass} min-h-[220px] font-mono text-sm`}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="About the role&#10;&#10;Responsibilities&#10;- …&#10;&#10;Requirements&#10;- …"
            required
          />
          <FieldError message={errors.description} />
        </div>

        <div className="space-y-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isRemote}
              onChange={(e) => update('isRemote', e.target.checked)}
              className="size-4 rounded border-line accent-[var(--accent)]"
            />
            Remote role
          </label>

          {!form.isRemote ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className={labelClass}>
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="San Francisco"
                />
                <FieldError message={errors.city} />
              </div>
              <div>
                <label htmlFor="country" className={labelClass}>
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  className={inputClass}
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                >
                  {FEATURED_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {form.country === 'Other' ? (
                  <>
                    <label htmlFor="countryOther" className={`${labelClass} mt-3`}>
                      Which country?
                    </label>
                    <input
                      id="countryOther"
                      name="countryOther"
                      className={inputClass}
                      value={form.countryOther}
                      onChange={(e) => update('countryOther', e.target.value)}
                      placeholder="e.g. Japan"
                      autoComplete="country-name"
                      required
                    />
                  </>
                ) : null}
                <FieldError message={errors.country} />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="country-remote" className={labelClass}>
                Region restriction (optional)
              </label>
              <select
                id="country-remote"
                name="country"
                className={inputClass}
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
              >
                <option value="">Worldwide</option>
                {FEATURED_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {form.country === 'Other' ? (
                <>
                  <label htmlFor="countryOther-remote" className={`${labelClass} mt-3`}>
                    Which country or region?
                  </label>
                  <input
                    id="countryOther-remote"
                    name="countryOther"
                    className={inputClass}
                    value={form.countryOther}
                    onChange={(e) => update('countryOther', e.target.value)}
                    placeholder="e.g. Japan"
                    autoComplete="country-name"
                    required
                  />
                  <FieldError message={errors.country} />
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="employmentType" className={labelClass}>
              Employment type
            </label>
            <select
              id="employmentType"
              name="employmentType"
              className={inputClass}
              value={form.employmentType}
              onChange={(e) => update('employmentType', e.target.value)}
            >
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
              <option value="TEMPORARY">Temporary</option>
            </select>
            <FieldError message={errors.employmentType} />
          </div>
          <div>
            <label htmlFor="compensationText" className={labelClass}>
              Compensation <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="compensationText"
              name="compensationText"
              className={inputClass}
              value={form.compensationText}
              onChange={(e) => update('compensationText', e.target.value)}
              placeholder="$140k–$180k + equity"
            />
            <FieldError message={errors.compensationText} />
          </div>
        </div>

        <div>
          <label htmlFor="buyerEmail" className={labelClass}>
            Your email
          </label>
          <p className={helpClass}>For the Stripe receipt. Never shown on the public job.</p>
          <input
            id="buyerEmail"
            name="buyerEmail"
            type="email"
            autoComplete="email"
            className={inputClass}
            value={form.buyerEmail}
            onChange={(e) => update('buyerEmail', e.target.value)}
            placeholder="you@company.com"
            required
          />
          <FieldError message={errors.buyerEmail} />
        </div>

        {formError ? <p className="text-sm text-red-400">{formError}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-accent px-5 text-base font-semibold text-accent-fg transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 sm:w-auto"
        >
          {pending ? 'Starting checkout…' : 'Pay $149 — post Featured for 30 days'}
        </button>
      </form>

      <aside className="lg:pt-1">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Board preview</p>
        <article className="mt-3 rounded-2xl border border-line bg-card p-5">
          <p className="text-xs font-semibold text-accent">Featured</p>
          <h2 className="mt-2 text-lg font-semibold text-balance">
            {form.title.trim() || 'Job title'}
          </h2>
          <p className="mt-1 text-sm text-muted">{form.companyName.trim() || 'Company'}</p>
          <p className="mt-3 text-sm text-muted">{previewLocation}</p>
        </article>
        <p className="mt-4 text-xs text-muted">
          $149 · 30 days near the top · candidates apply on your ATS only
        </p>
      </aside>
    </div>
  );
}
