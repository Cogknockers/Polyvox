import type { PartyAffiliation, ProfilePublic } from "@/lib/types/profile";

const PARTY_LABELS: Record<PartyAffiliation, string> = {
  unknown: "Unknown",
  democrat: "Democrat",
  republican: "Republican",
  independent: "Independent",
  libertarian: "Libertarian",
  green: "Green",
  constitution: "Constitution",
  nonpartisan: "Nonpartisan",
  other: "Other",
};

export function formatPublicLocation(profile: ProfilePublic) {
  const county = profile.location_county_name?.trim() ?? "";
  const city = profile.location_city?.trim() ?? "";
  const state = profile.location_state?.trim() ?? "";
  const country = profile.location_country?.trim() ?? "";

  if (county && state) {
    return `${county}, ${state}`;
  }
  if (city && state) {
    return `${city}, ${state}`;
  }
  if (county) {
    return county;
  }
  if (city) {
    return city;
  }
  if (state) {
    return state;
  }
  if (country) {
    return country;
  }
  return "Location not shared";
}

export function formatPublicParty(profile: ProfilePublic) {
  if (!profile.party_public) return null;
  const party = profile.party ?? "unknown";
  if (party === "other") {
    const label = profile.party_other_label?.trim();
    return label || PARTY_LABELS.other;
  }
  return PARTY_LABELS[party];
}

export function getPublicInitials(displayName: string, username: string) {
  if (displayName) {
    return displayName
      .split(" ")
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return "PV";
}
