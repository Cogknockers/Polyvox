import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type OfficeCardItem = {
  id: string;
  name: string;
  slug: string;
  holderName?: string | null;
};

type OfficeCardProps = {
  office: OfficeCardItem;
  countyFips: string;
};

export default function OfficeCard({ office, countyFips }: OfficeCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link
              href={`/county/${countyFips}/offices/${office.id}`}
              className="text-lg font-semibold text-foreground hover:underline"
            >
              {office.name}
            </Link>
            <p className="text-sm text-muted-foreground">/{office.slug}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/county/${countyFips}/offices/${office.id}`}>View</Link>
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Current holder:</span>{" "}
          {office.holderName ?? "Unknown"}
        </div>
      </CardContent>
    </Card>
  );
}
