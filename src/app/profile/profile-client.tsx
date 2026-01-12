"use client";

import Link from "next/link";
import type { ChangeEvent, DragEvent } from "react";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";

import type { ProfileRow } from "@/lib/data/profile";
import type { UserPreferencesRow } from "@/lib/data/preferences";
import {
  updateAvatarAction,
  updateProfileAction,
  type AvatarActionState,
  type ProfileActionState,
} from "@/app/profile/actions";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import PublicProfileCard from "@/components/profile/public-profile-card";
import PublicReputation, { type ReputationMetrics } from "@/components/profile/public-reputation";
import type { PartyAffiliation, ProfilePublic } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

type ProfileClientProps = {
  profile: ProfileRow | null;
  preferences: UserPreferencesRow | null;
  reputation: ReputationMetrics | null;
};

export default function ProfileClient({
  profile,
  preferences,
  reputation,
}: ProfileClientProps) {
  const [profileState, profileAction] = useActionState<ProfileActionState, FormData>(
    updateProfileAction,
    {},
  );
  const [avatarState, avatarAction] = useActionState<AvatarActionState, FormData>(
    updateAvatarAction,
    {},
  );
  const [avatarPending, startAvatarTransition] = useTransition();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [party, setParty] = useState<PartyAffiliation>(
    (profile?.party as PartyAffiliation) ?? "unknown",
  );
  const [partyOtherLabel, setPartyOtherLabel] = useState(
    profile?.party_other_label ?? "",
  );
  const [partyPublic, setPartyPublic] = useState(
    profile?.party_public ?? false,
  );
  const [locationCity, setLocationCity] = useState(profile?.location_city ?? "");
  const [locationCountyName, setLocationCountyName] = useState(
    profile?.location_county_name ?? "",
  );
  const [locationState, setLocationState] = useState(
    profile?.location_state ?? "",
  );
  const [locationCountry, setLocationCountry] = useState(
    profile?.location_country ?? "",
  );
  const badgeColor = preferences?.badge_color ?? "none";

  const previewProfile: ProfilePublic = {
    username,
    display_name: displayName,
    avatar_url: avatarUrl,
    badge_color: badgeColor,
    bio,
    party,
    party_other_label: partyOtherLabel,
    party_public: partyPublic,
    location_city: locationCity,
    location_county_name: locationCountyName,
    location_state: locationState,
    location_country: locationCountry,
  };

  useEffect(() => {
    if (profileState.ok) {
      toast({ title: "Profile updated" });
    }
    if (profileState.error) {
      toast({ title: "Update failed", description: profileState.error });
    }
  }, [profileState.ok, profileState.error]);

  useEffect(() => {
    if (avatarState.ok) {
      toast({ title: "Avatar updated" });
      setAvatarUrl(avatarState.avatarUrl ?? "");
    }
    if (avatarState.error) {
      toast({ title: "Avatar upload failed", description: avatarState.error });
    }
  }, [avatarState.ok, avatarState.error, avatarState.avatarUrl]);

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Profile</h1>
            <p className="text-muted-foreground">
              Manage your public profile and preferences.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {username.trim() ? (
              <Button variant="outline" asChild>
                <Link href={`/u/${username.trim()}`}>View public profile</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                View public profile
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal">
              <TabsList className="flex w-full flex-wrap">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6">
                <div className="space-y-6">
                  <AvatarUploader
                    avatarUrl={avatarUrl}
                    displayName={displayName}
                    username={username}
                    pending={avatarPending}
                    onUpload={(file) => {
                      const formData = new FormData();
                      formData.append("avatar", file);
                      startAvatarTransition(() => avatarAction(formData));
                    }}
                    onRemove={() => {
                      const formData = new FormData();
                      formData.append("intent", "remove");
                      startAvatarTransition(() => avatarAction(formData));
                    }}
                  />

                  <Separator />

                  <form action={profileAction} className="space-y-6">
                    <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="display_name">Display name</FieldLabel>
                      <Input
                        id="display_name"
                        name="display_name"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="Your name"
                      />
                      <FieldError>
                        {profileState.fieldErrors?.display_name}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="username">Username</FieldLabel>
                      <Input
                        id="username"
                        name="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="username"
                      />
                      <FieldDescription>
                        Lowercase letters, numbers, and hyphens.
                      </FieldDescription>
                      <FieldError>{profileState.fieldErrors?.username}</FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="bio">Bio</FieldLabel>
                      <Textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        placeholder="Share your civic interests."
                      />
                      <FieldError>{profileState.fieldErrors?.bio}</FieldError>
                    </Field>

                    <Field>
                      <FieldLabel>Party affiliation</FieldLabel>
                      <Select value={party} onValueChange={(value) => setParty(value as PartyAffiliation)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select party" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Unknown</SelectItem>
                          <SelectItem value="democrat">Democrat</SelectItem>
                          <SelectItem value="republican">Republican</SelectItem>
                          <SelectItem value="independent">Independent</SelectItem>
                          <SelectItem value="libertarian">Libertarian</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="constitution">Constitution</SelectItem>
                          <SelectItem value="nonpartisan">Nonpartisan</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="party" value={party} />
                      <FieldError>{profileState.fieldErrors?.party}</FieldError>
                    </Field>

                    {party === "other" ? (
                      <Field>
                        <FieldLabel htmlFor="party_other_label">
                          Other party label
                        </FieldLabel>
                        <Input
                          id="party_other_label"
                          name="party_other_label"
                          value={partyOtherLabel}
                          onChange={(event) => setPartyOtherLabel(event.target.value)}
                          placeholder="Describe your party"
                        />
                        <FieldError>
                          {profileState.fieldErrors?.party_other_label}
                        </FieldError>
                      </Field>
                    ) : null}

                    <Field orientation="horizontal">
                      <FieldLabel>Show party publicly</FieldLabel>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={partyPublic}
                          onCheckedChange={setPartyPublic}
                        />
                        <span className="text-sm text-muted-foreground">
                          {partyPublic ? "Visible" : "Hidden"}
                        </span>
                      </div>
                      <input
                        type="hidden"
                        name="party_public"
                        value={partyPublic ? "true" : "false"}
                      />
                      <FieldError>
                        {profileState.fieldErrors?.party_public}
                      </FieldError>
                    </Field>
                  </FieldGroup>

                    <Separator />
                    <SubmitRow label="Save personal info" />
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="location" className="mt-6">
                <form action={profileAction} className="space-y-6">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="location_country">Country</FieldLabel>
                      <Input
                        id="location_country"
                        name="location_country"
                        value={locationCountry}
                        onChange={(event) => setLocationCountry(event.target.value)}
                        placeholder="United States"
                      />
                      <FieldError>
                        {profileState.fieldErrors?.location_country}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="location_state">State</FieldLabel>
                      <Input
                        id="location_state"
                        name="location_state"
                        value={locationState}
                        onChange={(event) => setLocationState(event.target.value)}
                        placeholder="NV"
                      />
                      <FieldError>
                        {profileState.fieldErrors?.location_state}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="location_city">City</FieldLabel>
                      <Input
                        id="location_city"
                        name="location_city"
                        value={locationCity}
                        onChange={(event) => setLocationCity(event.target.value)}
                        placeholder="Reno"
                      />
                      <FieldError>
                        {profileState.fieldErrors?.location_city}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="location_county_name">
                        County
                      </FieldLabel>
                      <Input
                        id="location_county_name"
                        name="location_county_name"
                        value={locationCountyName}
                        onChange={(event) =>
                          setLocationCountyName(event.target.value)
                        }
                        placeholder="Washoe County"
                      />
                      <FieldError>
                        {profileState.fieldErrors?.location_county_name}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="location_county_fips">
                        County FIPS
                      </FieldLabel>
                      <Input
                        id="location_county_fips"
                        name="location_county_fips"
                        defaultValue={profile?.location_county_fips ?? ""}
                        placeholder="32031"
                      />
                      <FieldError>
                        {profileState.fieldErrors?.location_county_fips}
                      </FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="district_label">
                        District label
                      </FieldLabel>
                      <Input
                        id="district_label"
                        name="district_label"
                        defaultValue={profile?.district_label ?? ""}
                        placeholder="District 5"
                      />
                      <FieldError>
                        {profileState.fieldErrors?.district_label}
                      </FieldError>
                    </Field>
                  </FieldGroup>

                  <Separator />
                  <SubmitRow label="Save location info" />
                </form>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>

      <PublicReputation metrics={reputation} />
      <PublicProfileCard profile={previewProfile} variant="preview" />
    </div>
  );
}

function SubmitRow({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

type AvatarUploaderProps = {
  avatarUrl: string;
  displayName: string;
  username: string;
  pending: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
};

function AvatarUploader({
  avatarUrl,
  displayName,
  username,
  pending,
  onUpload,
  onRemove,
}: AvatarUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setIsOpen(true);
    setLocalError(null);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const initials = (displayName || username || "PV").slice(0, 2).toUpperCase();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setLocalError("Choose an image file to continue.");
      return;
    }
    setSelectedFile(file);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCropComplete = (_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  };

  const handleConfirm = async () => {
    if (!previewUrl || !croppedAreaPixels) {
      setLocalError("Pick a crop area before uploading.");
      return;
    }
    try {
      const croppedBlob = await getCroppedBlob(previewUrl, croppedAreaPixels);
      if (!croppedBlob) {
        setLocalError("Unable to prepare the image.");
        return;
      }
      const file = new File([croppedBlob], `avatar-${Date.now()}.png`, {
        type: "image/png",
      });
      onUpload(file);
      setIsOpen(false);
      setSelectedFile(null);
      setLocalError(null);
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Unable to crop the image.",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile photo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Profile avatar" />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "flex flex-1 flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground transition-colors",
              isDragActive && "border-primary/60 bg-muted/60",
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
          >
            <p>Drag & drop a new photo here, or browse.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                id={inputId}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleInputChange}
                className="hidden"
                ref={inputRef}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
              >
                Choose file
              </Button>
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  disabled={pending}
                >
                  Remove avatar
                </Button>
              ) : null}
            </div>
            <p className="text-xs">
              PNG, JPG, WEBP, or GIF. Max 2MB.
            </p>
            {localError ? (
              <p className="text-xs text-destructive">{localError}</p>
            ) : null}
          </div>
        </div>
      </CardContent>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setSelectedFile(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop your photo</DialogTitle>
            <DialogDescription>
              Drag to position your avatar and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-72 w-full overflow-hidden rounded-md border bg-muted">
            {previewUrl ? (
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
              />
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setSelectedFile(null);
              }}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={pending}>
              {pending ? "Uploading..." : "Use crop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

async function getCroppedBlob(imageSrc: string, crop: Area) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.92);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = src;
  });
}
