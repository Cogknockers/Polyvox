export type PartyAffiliation =
  | "unknown"
  | "democrat"
  | "republican"
  | "independent"
  | "libertarian"
  | "green"
  | "constitution"
  | "nonpartisan"
  | "other";

export type ProfilePublic = {
  username: string | null;
  display_name: string | null;
  avatar_url?: string | null;
  badge_color?: string | null;
  bio: string | null;
  party: PartyAffiliation | null;
  party_other_label: string | null;
  party_public: boolean | null;
  location_city: string | null;
  location_county_name: string | null;
  location_state: string | null;
  location_country: string | null;
};
