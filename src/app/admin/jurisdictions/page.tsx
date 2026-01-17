import JurisdictionActivationPanel from "@/components/admin/jurisdiction-activation";

export default function JurisdictionActivationPage() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Jurisdiction Activation
        </h1>
        <p className="text-sm text-muted-foreground">
          Activate counties, assign founders, and manage jurisdiction roles.
        </p>
      </header>

      <JurisdictionActivationPanel />
    </main>
  );
}
