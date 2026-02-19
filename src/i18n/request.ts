import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    const messages = {
        en: () => import('../../messages/en.json'),
        bn: () => import('../../messages/bn.json'),
        ar: () => import('../../messages/ar.json')
    };

    return {
        locale,
        messages: (await messages[locale as keyof typeof messages]()).default
    };
});
