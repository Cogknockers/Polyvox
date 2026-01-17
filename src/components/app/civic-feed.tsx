import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedItem from "@/components/app/feed-item";
import type { FeedItemBase } from "@/lib/mock-data";
import type { FeedTab } from "@/lib/filters";
import { DASHBOARD_TABS } from "@/lib/constants";

type CivicFeedProps = {
  items: FeedItemBase[];
  feedTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
};

export default function CivicFeed({ items, feedTab, onTabChange }: CivicFeedProps) {
  const renderFeed = () => (
    <ScrollArea className="h-[440px] pr-4">
      <div className="grid gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          items.map((item) => <FeedItem key={item.id} item={item} />)
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <Tabs
        value={feedTab}
        onValueChange={(value) => onTabChange(value as FeedTab)}
        className="w-full"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Civic feed</h2>
          <TabsList className="grid grid-cols-4">
            {DASHBOARD_TABS.feed.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {DASHBOARD_TABS.feed.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {renderFeed()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
