/**
 * Brand imagery.
 *
 * Every photograph in the Stitch design files, catalogued once so a component
 * never carries a 300-character URL inline.
 *
 * SOURCE SWITCH — read this before launch.
 *
 * The design files reference Google-hosted Stitch URLs. Those are fine for
 * development but they are NOT a hosting strategy: they can rotate or expire
 * without warning, they cannot be optimised by next/image as well as a local
 * file, and they add a third-party DNS lookup to the critical path.
 *
 * Run `npm run images:download` to pull all of them into /public/images, then
 * set USE_LOCAL_IMAGES to true. Nothing else needs to change — every call site
 * goes through `img()`.
 */

// All 15 files are present in public/images (npm run images:download).
const USE_LOCAL_IMAGES = true;

export interface BrandImage {
  /** Remote (Stitch) source. */
  remote: string;
  /** Local path once `npm run images:download` has been run. */
  local: string;
  /** Real alt text taken from the design files. */
  alt: string;
}

export const IMAGES = {
  heroImage: {
    remote: '/images/heroImage.jpg',
    local: '/images/heroImage.jpg',
    alt:
      'Astrologer Komal Kalra, the portrait used on the home page hero.',
  },
  heroPortrait: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBoLgpXUjC_IqXcGU1kH9GtAsF_4l_XguV2G8oFX2G4IIyZfBPb8NbAsQ02xD2fxpP-NR7vafxYGJlGEqyVdWqUppQ3_I3cE872UL2z7ETQunblgRtswLAAckdDOeHjEmPxeLjCltgEOrzchj1361vGsRfx6BucNocCDT_42SgYRoqqJNt7K7s32_FLMH7DiCxGPGAevzPe7ujWM8YkDk65Pm2Y34_cKnCtGFzBXZAGqB7T3C48RLon',
    local: '/images/heroPortrait.jpg',
    alt:
      "A highly professional, cinematic, medium-shot portrait of a mature woman dressed in elegant, understated attire, sitting in a serene, warmly lit study. The background is slightly blurred featuring neat bookshelves and soft, golden-hour…",
  },
  aboutStill: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDi7dnFcTB9ZrnQNYjE7FtldmoJa5Cp4qIuji9Fj2d1A3FZsPuFd0pjpMN9BDdCLEwl8V9khbhx8o1zABdf9S_g-K0g_O3S5JWw0TGehKvAv0FMTuRBCH9uC8R25mbkwl33Duh-1g0_n1YmsjZrX8VI_3uDStsVIpljIZ46PHsDuofXEmMw0CvqVobQXsuJuwEkud1DecYsgDABn7luWxJX1KRIqspunAha2BT9fvUjmf6pnfQ1CYDU',
    local: '/images/aboutStill.jpg',
    alt:
      "A minimalist still-life composition featuring a smooth, polished stone resting on a pristine, textured linen surface. The lighting is soft and directional, casting long, elegant shadows. A single, delicate, dried botanical stem lies…",
  },
  journalCompass: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDA7otnExcjJnjKZrMUu7CNh4_mp2QHVAsqnrHs-1ryvIEMVrurgUXIkmjEIdcfwl_kUfFXAxABF8YwpAdeJAVZg9rnZ5JCxqlBcrd-vtusPjLFsghk5OYOtEnsSSuttHwDx3t9Yk7knQA7E6DDBLXLR7X-WfxUWMRS7Ek13BObRPVnIKJNmdZp5mkq1UGqJ_XyGaMghww9jLFi116WJ7ZAKIxTETEDq_VGockxtTuRg1HpxZEfgp9z',
    local: '/images/journalCompass.jpg',
    alt:
      "A macro, detailed shot of an antique brass compass resting on top of complex architectural blueprints or minimalist architectural sketches. The lighting is crisp and moody, emphasizing the texture of the paper and the metallic sheen of…",
  },
  journalCandle: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB77C7NNiTexJbXHor4GfrTHlPLzL5J59xAT2sSN9ZTuZpM3untgw13M9MVI_WvMGm7cWomrdZsx8cRGG0lu_MvZRaYvMNSOtqxQufX_jjeQY4nnpyVCT5cEVK4BFRWsOiuPSRmyLaZGzz7D0lSWwSwYzGxwUKuGF6ydX_7GOSgqdsvo8pi1SgJYoe5QytaAot4DazLPJsxBNm2d-DTGtN6OlGQIM5kE5bDAIes5ZnaHty_P--_A31N',
    local: '/images/journalCandle.jpg',
    alt:
      "A serene, minimalist scene of a single lit white candle in a heavy, dark ceramic holder, placed on a clean wooden desk beside an open, high-quality leather-bound journal and a luxury fountain pen. The overall aesthetic is dark academia…",
  },
  serviceAstrologicalGuidance: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIwWf65E-H6pxKgXQQ0UDvE4KPbGy816r7G_fPYoWdAO_iZ2vixHBL8XUnOBSV06WnrtLar_CDRdNmAVUtpq_37qphszJG5UCt292Fm4xODpxHflkA0xNLoWr_Zil4KlCmdIDPiB8qfOWqjJ7twiwuBf8syp0_RPejTt2U0IPZTU6TLb9stF_H3HLxC_2zNYVBx_Ta_RZhi-WacfUy0NDKbkzYaBM8fQcDU3BD7KlzMfWWMw-uTNTD',
    local: '/images/serviceAstrologicalGuidance.jpg',
    alt:
      "A sophisticated, high-end editorial photograph of an antique brass astrolabe resting on a dark walnut table. The lighting is moody and dramatic, with soft, warm golden light illuminating the intricate details of the instrument against a…",
  },
  serviceLifeCoaching: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3SFnveM_OKrRRL53okv_SN7A6oTkXFBmyvNGawq6DEv64POTwfLWfn6idyymci-bPwRBPOo7duZzLRW7n5Db1-xhCQs7AzVvbKMMZ22cFuA4NE01Xdvdldrv8zDLl7WgHq8j32KjIjezvJozZtUYyWI0vFqro_3kG03B2KZbY4HOKVKgSZBRPElsDVMMyE4KKbInuufKVWEaBIq5O7q4SZYU-RonE-8J_u_AA41AG9j_FBqNJNdl0',
    local: '/images/serviceLifeCoaching.jpg',
    alt:
      "Editorial photograph from the Komal Kalra brand imagery set.",
  },
  serviceHealing: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAM2mCYzi6jUOps-RHyjqc4naWYiSa_LCOzulqxk3S4DnFxTPNQ49BVzvEMwH8CViG5gPwG7tNmodxTtPo9OVrFWz3CsJKfmVvmse_wJIVdI1H4dTQHBw0CfECoeXtkwFwwnjZB7qySAELju67qEW6H5utujfY5Y5N1EZuSXCcF4er5-cXvJIVlkFv9jLZF5gw_sB32CNr1codrULXFJOrjbmpK0FQyDApNj0bqDzG6XnOoM4i92GTA',
    local: '/images/serviceHealing.jpg',
    alt:
      "Editorial photograph from the Komal Kalra brand imagery set.",
  },
  serviceCounselling: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApY59Sd3XLLXUEC-KNs4xQqSgxAmXx6du-ItzFys9yfWDL-4ViyXSKDi3BX27QcY6BlxVq1kIWFLPfUECYImApIpJXch9zI29l2mc-qDZv2W7jcEjvLkXpLR0KeTH8VJcl9itlBxAny_lweDsycm3ayUEgB205Zkeu2WgzVGumJ5SQ_qeAJVEHuTTt0O3qwkE18nnG4NMcxlAQoz2GZXUtsqn1l2Qkhxq0j08zQWEycVWm6AK8sT97',
    local: '/images/serviceCounselling.jpg',
    alt:
      "Editorial photograph from the Komal Kalra brand imagery set.",
  },
  serviceKundliMilan: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAInVugbXKGnu2VKoMum2FgUftGolvoZIYtMv-cOypHgfER_7UmstRnWq6JsuthQOaQEk-CnEUbGPhJORmVI-CVLk1JtFwCfgc2Hu_XIiKW9F1bVTurgCEiEbWXC9hpS-Fc8zdY90I1AafkxYG8QIrHRHwY4KWuljDfDueFDBQtnFaPRCGGGscI2yqVga7xf3c2eEFY1ZIywTzIaDr873yaEDKI9n2xDsl22e1WhZNAiC3P4h4Fh_IY',
    local: '/images/serviceKundliMilan.jpg',
    alt:
      "Editorial photograph from the Komal Kalra brand imagery set.",
  },
  healingDetail1: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBp4-018_fOKU7q_L_2vxjnA8aRapEXPMJcLa4sNXCHH6TwtpkJPcZZmjBSzbklM7CLvgZ9Vi_inTLeklIQt6raeomrEzrqYbsJMXN7Ed2Y62B2nkgU4CbZomKLh8W2zx-CVJQC3hHwwhtW6F9zRV9GAdhMOBUslAwscctCgEuXX3xiEhM-NnEQtDtTUJIfUmYMP9eeKPi9U3D-ruk5qxadSGa6cU8iwxigszRH6twA8qRlFYNevkYj',
    local: '/images/healingDetail1.jpg',
    alt:
      "A macro, abstract photograph of smooth, rounded river stones stacked delicately in a minimalist composition. The lighting is soft and diffused, creating a serene, calm atmosphere in a light-mode 'Silent Luxury' aesthetic. Tones of warm…",
  },
  healingDetail2: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4HkLwCxb4iCRapwFJDraNXLD6oyIKGP3nhuTkKyfBY9HFGDwf7P7cVFamm3digXz6-vK4qM3bife-kdETYvxWBGv51Vn0AOTAGZalbvhlOqFshXczGB3TemxZdPQ1cv4TNRA04SjQHpqtLN5FtM31wPFsxWvcvHI4QhC9aacV_V3QU44G_O0XPvEHLXjJJ3U8s2uKipgcttDgcg2ZRVIf_VZwzIsxVmgLWWKlcZFataqJlK8p_cbt',
    local: '/images/healingDetail2.jpg',
    alt:
      "An ethereal, minimalist photograph capturing the subtle movement of incense smoke against a soft, creamy background. The light-mode composition relies on fluid, organic lines and quiet whitespace, embodying the concept of release. The…",
  },
  healingDetail3: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuALPhVEgCi9v-nzWS_UeTz6MeKo4PXpqq-amMiDVwJETJZlphlwpG3mMu0G7uKDLUHsIn-jioL3RuwQEgk8MDi80y3BA1ReNBPADjC9ShXOCu5SlC_HE5HY7cW-eXvb450wnfK1dB0bpZVT2L018WANOHCLMKSd47qMcbxEmCsU7HB5R_HDCSSHfz05v9UtmqtuvD3AbYR4RkE1EQJ-t3DXfF53JFW-SkTJIO6mVIeBbizgWkUy5V__',
    local: '/images/healingDetail3.jpg',
    alt:
      "A refined, editorial image showing a single, perfectly illuminated drop of water creating expanding ripples on a calm, bright surface. The visual language is pure 'Silent Luxury', utilizing negative space, high contrast in light tones,…",
  },
  kundliDetail1: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDD2kCGzosJ9J_b5PQ4ZAVX7O8T8ZWPGIIY7tkqhp6dg4vwRBVDmBya7zwvHDS9vma7m2896H4e7OB1BRDzo9fHRlNqcJhXUNyxyaveCq2WcnKZCVCozr7TUG_MGfGG10x0nX01HoFBXq4t0n8EQ6Yuwpq9FYXuUvCHDbidxmrMe-Tmgl1m2hZO8qq2whEW59XPTJJmuP9J3KC7g0t9JnsbZgucgsX4Gi2WtltAM7JrOJXt72gZUEbK',
    local: '/images/kundliDetail1.jpg',
    alt:
      "A minimalist, editorial-style composition showing the process of astrological consultation. A sleek, modern desk surface in warm ivory tones. Minimalist tools of the trade are carefully arranged: a fine fountain pen, heavy, textured…",
  },
  practitionerPortrait: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJKnKilXNrLb0npMP7-WtZWy5KjYefQWGvXlLvrVkzB1dreYLLYN0f0vJk9ie78sDjA6vQ0PpA2B1YCHZYU3gxoWG0LvOFIQlS5XJ_xf6gJRPGS25n0njcj7_vNQ0ztzVKo1YkJsdXc-uNcyjgdosmW0B6UwCCzHQRVV_OVUKcDwqyv3EZJAsqvNG8bVLnVaPcwtDchtJs5LBZxeWP-u39zV9MSwh0FgVbEECKZXWoWc5Dg1LXRA-d',
    local: '/images/practitionerPortrait.jpg',
    alt:
      "A professional, high-end portrait photograph of Astrologer Komal Kalra. She is dressed elegantly in subtle, warm earthy tones, looking directly at the camera with a calm, authoritative yet welcoming expression. The lighting is soft and…",
  },
  confirmationMandala: {
    remote:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBUM_0ZbRus9KdUrel6Rhu3UdlLS_IpKvI22FWpa3isdUpzqRcCpqkB44DMBJUrx4xrNGd-VuuaWIhqJ2qQCiv9qYehjkLXz6BRTrChCgHfNZYlGB-9DdeuX4pg478yhcL7ruxxuv0GoSSYQ2bspjsuUN-9xMWOAHvMVuKDfwV8ei-6QrBfIhRpO6nCJgC9S3baj3m4MmTx28PqRMrd61oOzbKJ60EtiKVcjL2yvWMeOOPElJ9X7arr',
    local: '/images/confirmationMandala.jpg',
    alt:
      "A subtle, minimalist abstract representation of a serene cosmic alignment or mandala, using very faint muted gold and warm ivory tones, designed as a small, elegant decorative element for a luxury spiritual website. Professional,…",
  },
} as const satisfies Record<string, BrandImage>;

export type ImageKey = keyof typeof IMAGES;

/** Resolves an image to whichever source is currently configured. */
export function img(key: ImageKey): { src: string; alt: string } {
  const entry = IMAGES[key];
  return { src: USE_LOCAL_IMAGES ? entry.local : entry.remote, alt: entry.alt };
}

/**
 * Maps a service slug to its hero photograph.
 *
 * Falls back to the astrological-guidance image rather than rendering a broken
 * frame, so adding a service in the admin panel before its photograph exists
 * degrades gracefully instead of failing.
 */
const SERVICE_IMAGE: Record<string, ImageKey> = {
  'astrological-guidance': 'serviceAstrologicalGuidance',
  'life-coaching': 'serviceLifeCoaching',
  'healing-session': 'serviceHealing',
  counselling: 'serviceCounselling',
  'kundli-milan': 'serviceKundliMilan',
};

export function serviceImage(slug: string) {
  return img(SERVICE_IMAGE[slug] ?? 'serviceAstrologicalGuidance');
}
