export type MentionTargetType = "profile" | "entity" | "office";

export type MentionToken = {
  id: string;
  label: string;
  type: MentionTargetType;
  start: number;
  end: number;
};

export type MentionOption = {
  id: string;
  label: string;
  type: MentionTargetType;
  sublabel?: string;
};
