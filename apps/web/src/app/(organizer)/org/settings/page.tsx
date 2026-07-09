import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrgSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your organizer account preferences." />
      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Update your profile, notifications, and security from the settings pages.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Control which email and in-app alerts you receive.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
