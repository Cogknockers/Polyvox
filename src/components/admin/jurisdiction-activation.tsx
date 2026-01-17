"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { toast } from "@/hooks/use-toast";
import {
  activateCounty,
  archiveJurisdiction,
  assignRole,
  listActivatedJurisdictions,
  searchCounties,
  searchUsers,
  type CountyResult,
  type JurisdictionRow,
  type UserResult,
} from "@/app/admin/jurisdictions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const roleOptions = ["founder", "moderator", "editor", "member"] as const;
type RoleOption = (typeof roleOptions)[number];

export default function JurisdictionActivationPanel() {
  const [countyQuery, setCountyQuery] = useState("");
  const [countyResults, setCountyResults] = useState<CountyResult[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<CountyResult | null>(null);

  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  const [jurisdictions, setJurisdictions] = useState<JurisdictionRow[]>([]);

  const [isSearchingCounties, startCountySearch] = useTransition();
  const [isSearchingUsers, startUserSearch] = useTransition();
  const [isActivating, startActivation] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();

  useEffect(() => {
    startRefresh(async () => {
      try {
        const result = await listActivatedJurisdictions();
        if (result.error) {
          toast({
            title: "Load failed",
            description: result.error,
            variant: "destructive",
          });
        }
        setJurisdictions(result.data);
      } catch (error) {
        toast({
          title: "Load failed",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "destructive",
        });
        setJurisdictions([]);
      }
    });
  }, [startRefresh]);

  useEffect(() => {
    const query = countyQuery.trim();
    if (query.length < 2) {
      setCountyResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startCountySearch(async () => {
        try {
          const results = await searchCounties(query);
          setCountyResults(results);
        } catch (error) {
          toast({
            title: "County search failed",
            description: error instanceof Error ? error.message : "Try again.",
            variant: "destructive",
          });
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [countyQuery, startCountySearch]);

  useEffect(() => {
    const query = userQuery.trim();
    if (query.length < 2) {
      setUserResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startUserSearch(async () => {
        try {
          const results = await searchUsers(query);
          setUserResults(results);
        } catch (error) {
          toast({
            title: "User search failed",
            description: error instanceof Error ? error.message : "Try again.",
            variant: "destructive",
          });
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [userQuery, startUserSearch]);

  const canActivate = Boolean(selectedCounty && selectedUser);

  const statusLabel = (status?: string | null) => {
    if (!status) return "Unknown";
    return status.toLowerCase();
  };

  const handleActivate = () => {
    if (!selectedCounty || !selectedUser) {
      return;
    }
    startActivation(async () => {
      const result = await activateCounty({
        fips: selectedCounty.fips,
        founderUserId: selectedUser.user_id,
      });

      if (result?.error) {
        toast({
          title: "Activation failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Jurisdiction activated",
        description: `${selectedCounty.name} County is now active.`,
      });

      setCountyQuery("");
      setUserQuery("");
      setSelectedCounty(null);
      setSelectedUser(null);

      const refreshed = await listActivatedJurisdictions();
      if (refreshed.error) {
        toast({
          title: "Refresh failed",
          description: refreshed.error,
          variant: "destructive",
        });
      }
      setJurisdictions(refreshed.data);
    });
  };

  const handleArchive = (jurisdictionId: string) => {
    startRefresh(async () => {
      const result = await archiveJurisdiction({ jurisdictionId });
      if (result?.error) {
        toast({
          title: "Archive failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Jurisdiction archived",
        description: "Status set to archived.",
      });
      const refreshed = await listActivatedJurisdictions();
      if (refreshed.error) {
        toast({
          title: "Refresh failed",
          description: refreshed.error,
          variant: "destructive",
        });
      }
      setJurisdictions(refreshed.data);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Activate County</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">County search</label>
            <Input
              value={countyQuery}
              onChange={(event) => setCountyQuery(event.target.value)}
              placeholder="Search counties..."
            />
            <ScrollArea className="h-40 rounded-md border border-border">
              <div className="space-y-2 p-3">
                {isSearchingCounties ? (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                ) : null}
                {!isSearchingCounties && countyResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No county matches yet.
                  </p>
                ) : null}
                {countyResults.map((county) => (
                  <button
                    key={county.fips}
                    type="button"
                    onClick={() => setSelectedCounty(county)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                      selectedCounty?.fips === county.fips
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <span>
                      {county.name} County
                      <span className="ml-2 text-xs text-muted-foreground">
                        {county.statefp} - {county.fips}
                      </span>
                    </span>
                    {selectedCounty?.fips === county.fips ? (
                      <Badge variant="secondary">Selected</Badge>
                    ) : null}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div className="space-y-3">
            <label className="text-sm font-medium">Founder user</label>
            <Input
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="Search users by email or name..."
            />
            <ScrollArea className="h-40 rounded-md border border-border">
              <div className="space-y-2 p-3">
                {isSearchingUsers ? (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                ) : null}
                {!isSearchingUsers && userResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No user matches yet.
                  </p>
                ) : null}
                {userResults.map((user) => (
                  <button
                    key={user.user_id}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                      selectedUser?.user_id === user.user_id
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <span>
                      {user.display_name || user.username || user.email || "User"}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {user.email ?? "No email"}
                      </span>
                    </span>
                    {selectedUser?.user_id === user.user_id ? (
                      <Badge variant="secondary">Selected</Badge>
                    ) : null}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Button
            onClick={handleActivate}
            disabled={!canActivate || isActivating}
            className="w-full"
          >
            {isActivating ? "Activating..." : "Activate & Assign Founder"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activated Jurisdictions</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              startRefresh(async () => {
                const refreshed = await listActivatedJurisdictions();
                if (refreshed.error) {
                  toast({
                    title: "Refresh failed",
                    description: refreshed.error,
                    variant: "destructive",
                  });
                }
                setJurisdictions(refreshed.data);
              });
            }}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Jurisdiction</th>
                  <th className="px-4 py-3 font-medium">FIPS</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jurisdictions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      No activated jurisdictions yet.
                    </td>
                  </tr>
                ) : (
                  jurisdictions.map((jurisdiction) => (
                    <tr
                      key={jurisdiction.id}
                      className="border-t border-border"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{jurisdiction.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {jurisdiction.activated_at
                            ? new Date(jurisdiction.activated_at).toLocaleDateString()
                            : "No activation date"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {jurisdiction.external_id ?? "--"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {statusLabel(jurisdiction.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {jurisdiction.roles_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {jurisdiction.external_id ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/county/${jurisdiction.external_id}`}>
                                Preview
                              </Link>
                            </Button>
                          ) : null}
                          <AssignRoleDialog
                            jurisdictionId={jurisdiction.id}
                            onAssigned={async () => {
                              const refreshed = await listActivatedJurisdictions();
                              if (refreshed.error) {
                                toast({
                                  title: "Refresh failed",
                                  description: refreshed.error,
                                  variant: "destructive",
                                });
                              }
                              setJurisdictions(refreshed.data);
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchive(jurisdiction.id)}
                          >
                            Archive
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type AssignRoleDialogProps = {
  jurisdictionId: string;
  onAssigned: () => Promise<void> | void;
};

function AssignRoleDialog({ jurisdictionId, onAssigned }: AssignRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [role, setRole] = useState<RoleOption>("moderator");
  const [isSearching, startSearch] = useTransition();
  const [isAssigning, startAssign] = useTransition();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedUser(null);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startSearch(async () => {
        try {
          const data = await searchUsers(trimmed);
          setResults(data);
        } catch (error) {
          toast({
            title: "User search failed",
            description: error instanceof Error ? error.message : "Try again.",
            variant: "destructive",
          });
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [open, query, startSearch]);

  const canAssign = Boolean(selectedUser && role);

  const handleAssign = () => {
    if (!selectedUser) {
      return;
    }

    startAssign(async () => {
      const result = await assignRole({
        jurisdictionId,
        userId: selectedUser.user_id,
        role,
      });

      if (result?.error) {
        toast({
          title: "Assign role failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Role assigned",
        description: `${selectedUser.email ?? "User"} is now ${role}.`,
      });
      await onAssigned();
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Assign role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign jurisdiction role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">User</label>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by email or name..."
            />
            <ScrollArea className="h-32 rounded-md border border-border">
              <div className="space-y-2 p-3">
                {isSearching ? (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                ) : null}
                {!isSearching && results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matches yet.</p>
                ) : null}
                {results.map((user) => (
                  <button
                    key={user.user_id}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                      selectedUser?.user_id === user.user_id
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <span>
                      {user.display_name || user.username || user.email || "User"}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {user.email ?? "No email"}
                      </span>
                    </span>
                    {selectedUser?.user_id === user.user_id ? (
                      <Badge variant="secondary">Selected</Badge>
                    ) : null}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={(value) => setRole(value as RoleOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAssign} disabled={!canAssign || isAssigning}>
            {isAssigning ? "Assigning..." : "Assign role"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
