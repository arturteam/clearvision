(function () {
    "use strict";

    const MEASUREMENT_ID = "G-JRSDRDMQYS";
    const CONSENT_STORAGE_KEY = "clear_vision_analytics_consent";
    const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;

    let analyticsLoaded = false;
    let banner;
    let currentConsent = null;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
    };

    window.gtag("consent", "default", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        functionality_storage: "granted",
        security_storage: "granted",
        wait_for_update: 500
    });

    window.gtag("set", "ads_data_redaction", true);

    const readConsent = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
            if (!saved || !["granted", "denied"].includes(saved.value)) return null;
            if (Date.now() - saved.savedAt > CONSENT_LIFETIME_MS) {
                localStorage.removeItem(CONSENT_STORAGE_KEY);
                return null;
            }
            return saved.value;
        } catch (error) {
            return null;
        }
    };

    const saveConsent = (value) => {
        currentConsent = value;
        try {
            localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
                value,
                savedAt: Date.now()
            }));
        } catch (error) {
            // The choice still applies to the current page if storage is unavailable.
        }
    };

    const removeAnalyticsCookies = () => {
        document.cookie.split(";").forEach((cookie) => {
            const name = cookie.split("=")[0].trim();
            if (name === "_ga" || name.startsWith("_ga_")) {
                document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
            }
        });
    };

    const loadAnalytics = () => {
        if (analyticsLoaded) return;
        analyticsLoaded = true;

        window.gtag("consent", "update", {
            analytics_storage: "granted",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied"
        });
        window.gtag("js", new Date());
        window.gtag("config", MEASUREMENT_ID, {
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            cookie_expires: 15552000,
            send_page_view: true
        });

        const googleTag = document.createElement("script");
        googleTag.async = true;
        googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
        googleTag.dataset.clearVisionAnalytics = "true";
        googleTag.addEventListener("error", () => {
            analyticsLoaded = false;
        });
        document.head.appendChild(googleTag);
    };

    const closeBanner = () => {
        if (!banner) return;
        banner.hidden = true;
        document.body.classList.remove("consent-banner-visible");
    };

    const openBanner = () => {
        if (!banner) return;
        banner.hidden = false;
        document.body.classList.add("consent-banner-visible");
        banner.querySelector("[data-consent-accept]")?.focus();
    };

    const acceptAnalytics = () => {
        saveConsent("granted");
        loadAnalytics();
        closeBanner();
    };

    const rejectAnalytics = () => {
        const analyticsWasActive = analyticsLoaded || currentConsent === "granted";
        saveConsent("denied");
        window.gtag("consent", "update", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied"
        });
        removeAnalyticsCookies();
        closeBanner();

        if (analyticsWasActive) window.location.reload();
    };

    const createConsentBanner = () => {
        banner = document.createElement("section");
        banner.className = "consent-banner";
        banner.hidden = true;
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-labelledby", "consent-title");
        banner.setAttribute("aria-describedby", "consent-description");
        banner.innerHTML = `
            <div class="consent-banner__content">
                <div class="consent-banner__copy">
                    <p class="consent-banner__eyebrow">Privacy choices · Ustawienia prywatności</p>
                    <h2 id="consent-title">Help us improve Clear Vision</h2>
                    <p id="consent-description">
                        With your permission, we use Google Analytics to understand visits and clicks leading to Google Play.
                        Za Twoją zgodą używamy Google Analytics, aby mierzyć odwiedziny i kliknięcia prowadzące do Google Play.
                    </p>
                    <a href="privacy.html#website-analytics">Privacy details · Szczegóły prywatności</a>
                </div>
                <div class="consent-banner__actions">
                    <button class="consent-button consent-button--primary" type="button" data-consent-accept>
                        Accept analytics · Akceptuję
                    </button>
                    <button class="consent-button consent-button--secondary" type="button" data-consent-reject>
                        Reject · Odrzuć
                    </button>
                </div>
            </div>`;

        banner.querySelector("[data-consent-accept]")?.addEventListener("click", acceptAnalytics);
        banner.querySelector("[data-consent-reject]")?.addEventListener("click", rejectAnalytics);
        document.body.appendChild(banner);
    };

    const addConsentSettingsLinks = () => {
        document.querySelectorAll(".footer-links").forEach((footerLinks) => {
            if (footerLinks.querySelector("[data-consent-settings]")) return;
            const button = document.createElement("button");
            button.className = "footer-consent-link";
            button.type = "button";
            button.dataset.consentSettings = "true";
            button.textContent = "Cookie settings";
            footerLinks.appendChild(button);
        });

        document.querySelectorAll("[data-consent-settings]").forEach((button) => {
            button.addEventListener("click", openBanner);
        });
    };

    const trackGooglePlayClicks = () => {
        document.addEventListener("click", (event) => {
            if (!(event.target instanceof Element)) return;
            const link = event.target.closest("a[href*='play.google.com']");
            if (!link || currentConsent !== "granted" || !analyticsLoaded) return;

            const url = new URL(link.href, window.location.href);
            const product = link.dataset.analyticsProduct
                || url.searchParams.get("id")
                || (url.pathname.includes("/store/apps/dev") ? "developer_page" : "unspecified");

            window.gtag("event", "play_store_click", {
                product,
                link_url: url.href,
                link_text: link.textContent.trim().slice(0, 100),
                page_path: window.location.pathname
            });
        });
    };

    const initialize = () => {
        createConsentBanner();
        addConsentSettingsLinks();
        trackGooglePlayClicks();

        currentConsent = readConsent();
        if (currentConsent === "granted") {
            loadAnalytics();
        } else if (currentConsent === null) {
            openBanner();
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
