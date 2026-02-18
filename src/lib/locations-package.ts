
import { Country, State, City } from 'country-state-city';

// Helper to get all countries
export const getAllCountries = () => {
    return Country.getAllCountries().map(country => ({
        name: country.name,
        isoCode: country.isoCode
    }));
};

// Helper to get states of a country
export const getStatesOfCountry = (countryCode: string) => {
    return State.getStatesOfCountry(countryCode).map(state => ({
        name: state.name,
        isoCode: state.isoCode
    }));
};

// Helper to get cities of a state
export const getCitiesOfState = (countryCode: string, stateCode: string) => {
    const cities = City.getCitiesOfState(countryCode, stateCode);
    if (!cities) return [];
    return cities.map(city => ({
        name: city.name
    }));
};

// Helper to get cities of a country (if no state selected, though usually too large)
export const getCitiesOfCountry = (countryCode: string) => {
    const cities = City.getCitiesOfCountry(countryCode);
    if (!cities) return [];

    const uniqueCityNames = new Set<string>();
    const uniqueCities: { name: string }[] = [];

    cities.forEach(city => {
        if (!uniqueCityNames.has(city.name)) {
            uniqueCityNames.add(city.name);
            uniqueCities.push({ name: city.name });
        }
    });

    return uniqueCities.sort((a, b) => a.name.localeCompare(b.name));
};
